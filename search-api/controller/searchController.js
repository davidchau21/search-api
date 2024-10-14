const axios = require('axios');
const { search } = require('duck-duck-scrape');
const extractContentFromUrl = require('../middleware/contentExtractor');
const SearchResult = require('../model/Search');
const extractJsDom = require('../middleware/extractJsDom.js');
const Queue = require('bull');
require('dotenv').config();

const googleSearchUrl = process.env.GOOGLE_SEARCH_URL;
const googleApiKey = process.env.GOOGLE_API_KEY;
const googleCx = process.env.GOOGLE_CX;
const duckduckgoSearchUrl = process.env.DUCKDUCKGO_SEARCH_URL;

exports.duckduckgoSearch = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
        const response = await axios.get(duckduckgoSearchUrl, {
            params: {
                q: query,
                format: 'json',
                no_redirect: '1',
                no_html: '1',
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching search results from DuckDuckGo' });
    }
};

exports.googleSearch = async (req, res) => {
    const { queries, start = 1, num = 10 } = req.body; 
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid queries parameter' });
    }

    try {
        const jobPromises = queries.map(async (query) => {
            const existingResults = await SearchResult.findOne({ keyword: query });
            if (!existingResults) {
                const response = await axios.get(googleSearchUrl, {
                    params: {
                        key: googleApiKey,
                        cx: googleCx,
                        q: query,
                        start,
                        num,
                    },
                });

                const { queries, items, searchInformation } = response.data;

                const page = (queries.request || [])[0] || {};
                const previousPage = (queries.previousPage || [])[0] || {};
                const nextPage = (queries.nextPage || [])[0] || {};

                const data = {
                    q: query,
                    totalResults: page.totalResults,
                    count: page.count,
                    startIndex: page.startIndex,
                    nextPage: nextPage.startIndex,
                    previousPage: previousPage.startIndex,
                    time: searchInformation.searchTime,
                    items: items.map(o => ({
                        link: o.link,
                        title: o.title,
                        snippet: o.snippet,
                        img: (((o.pagemap || {}).cse_image || {})[0] || {}).src,
                    })),
                };

                await saveFromeGG(query, data.items);
            } else {
                console.log(`Search results for query "${query}" already exist in the database.`);
            }
        });

        await Promise.all(jobPromises);

        res.status(200).json({ message: 'Queries processed and saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing queries' });
    }
};

exports.duckduckgoScrapeSearch = async (req, res) => {
    const { queries } = req.body; // Expecting an array of queries in the request body
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid queries parameter' });
    }

    try {
        const jobPromises = queries.map(async (query) => {
            const existingResults = await SearchResult.findOne({ keyword: query });
            if (!existingResults) {
                const results = await search(query);
                const topResults = results.results.slice(0, 10);
                await saveFromDuckDuckGo(query, topResults);
            } else {
                console.log(`Search results for query "${query}" already exist in the database.`);
            }
        });

        // Wait for all jobs to complete
        await Promise.all(jobPromises);

        // When all jobs are completed or data already exists in the database
        res.status(200).json({ message: 'Queries processed and saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing queries' });
    }
};

const saveFromeGG = async (query, items) => {
    try {
        const validItems = [];

        for (const item of items) {
            try {
                const extractedContent = await extractContentFromUrl(item.link);
                if (extractedContent) {
                    validItems.push(extractedContent);
                } else {
                    console.warn(`Extraction returned null for ${item.link}`);
                }
            } catch (error) {
                console.error(`Error accessing or extracting content from ${item.link}:`, error);
            }
        }

        if (validItems.length > 0) {
            const searchResult = new SearchResult({ keyword: query, results: validItems });
            await searchResult.save();

            console.log(`Saved search results for query: ${query}`);
        } else {
            console.log(`No valid results to save for query: ${query}`);
        }

    } catch (error) {
        console.error(`Error saving extracted content for query "${query}":`, error);
    }
};

const saveFromDuckDuckGo = async (query, results) => {
    try {

        // const existingResults = await SearchResult.findOne({ keyword: query });
        // if (existingResults) {
        //     console.log(`Search results for query "${query}" already exist in the database.`);
        //     return;
        // }

        const validItems = [];

        for (const item of results) {
            try {
                const extractedContent = await extractContentFromUrl(item.url);
                if (extractedContent) {
                    validItems.push(extractedContent);
                } else {
                    console.warn(`Extraction returned null for ${item.link}`);
                }
            } catch (error) {
                console.error(`Error accessing or extracting content from ${item.link}:`, error);
            }
        }

        if (validItems.length > 0) {
            const searchResult = new SearchResult({ keyword: query, results: validItems });
            await searchResult.save();
            console.log(`Saved search results for query: ${query}`);
        } else {
            console.log(`No valid results to save for query: ${query}`);
        }

    } catch (error) {
        console.error(`Error saving extracted content for query "${query}":`, error);
    }
};

const saveFromGGJsDom = async (query, items) => {
    try {
        const extractedItems = await Promise.all(items.map(async (item) => {
            try {
                const extractedContent = await extractJsDom(item.link);
                return extractedContent; // Trả về nội dung đã trích xuất
            } catch (error) {
                console.error(`Error accessing or extracting content from ${item.link}:`, error);
                return null; // Trả về null nếu không truy xuất được
            }
        }));

        // Lọc bỏ các mục null (các trang không truy cập được)
        const validItems = extractedItems.filter(item => item !== null);

        if (validItems.length > 0) {
            // Giả sử bạn có một model SearchResult để lưu kết quả
            const searchResult = new SearchResult({ keyword: query, results: validItems });
            await searchResult.save();
            console.log(`Saved search results for query: ${query}`);
        } else {
            console.log(`No valid results to save for query: ${query}`);
        }
    } catch (error) {
        console.error(`Error saving extracted content for query "${query}":`, error);
    }
};

const saveFromDuckGoJsDom = async (query, results) => {
    try {
        const extractedItems = await Promise.all(results.map(async (item) => {
            try {
                const extractedContent = await extractJsDom(item.url);
                return extractedContent; 
            } catch (error) {
                console.error(`Error accessing or extracting content from ${item.url}:`, error);
                return null; 
            }
        }));

        
        const validItems = extractedItems.filter(item => item !== null);

        if (validItems.length > 0) {
           
            const searchResult = new SearchResult({ keyword: query, results: validItems });
            await searchResult.save();
            console.log(`Saved search results for query: ${query}`);
        } else {
            console.log(`No valid results to save for query: ${query}`);
        }
    } catch (error) {
        console.error(`Error saving extracted content for query "${query}":`, error);
    }
};

exports.getSearchResults = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
        const searchResults = await SearchResult.find({ keyword: query });
        console.log('result: ', searchResults);
        res.json(searchResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching search results' });
    }
}

exports.getMultipleSearchResults = async (req, res) => {
    const { queries } = req.body; 
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid queries parameter' });
    }

    try {
        const searchResults = await SearchResult.find({ keyword: { $in: queries } });
        res.json(searchResults);
        // console.log('result: ', searchResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching search results' });
    }
};

exports.searchVideo = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: process.env.GOOGLE_API_KEY,
                part: 'snippet',
                q: query,
                maxResults: 10,
                type: 'video',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching video search results' });
    }
};

exports.searchImage = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
        const response = await axios.get(googleSearchUrl, {
            params: {
                key: process.env.GOOGLE_API_KEY,
                cx: process.env.GOOGLE_CX,
                q: query,
                searchType: 'image',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching image search results' });
    }
}

