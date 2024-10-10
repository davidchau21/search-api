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

const searchQueue = new Queue('searchQueue', {
    redis: {
        host: '127.0.0.1',
        port: 6379,
    },
});

exports.googleSearch = async (req, res) => {
    const { queries, start = 1, num = 10 } = req.body; // Expecting an array of queries in the request body
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid queries parameter' });
    }

    try {
        for (const query of queries) {
            await searchQueue.add({ query, start, num });
        }
        res.status(200).json({ message: 'Queries added to the queue' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding queries to the queue' });
    }
};

searchQueue.process(async (job, done) => {
    const { query, start, num } = job.data;

    try {
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

        console.log(`Search results for query "${query}" processed and saved.`);
        done();
    } catch (error) {
        console.error(`Error processing search results for query "${query}":`, error);
        done(new Error(`Error processing search results for query "${query}"`));
    }
});

const duckduckgoQueue = new Queue('duckduckgoQueue', {
    redis: {
        host: '127.0.0.1',
        port: 6379,
    },
});

exports.duckduckgoScrapeSearch = async (req, res) => {
    const { queries } = req.body; // Expecting an array of queries in the request body
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid queries parameter' });
    }

    try {
        for (const query of queries) {
            await duckduckgoQueue.add({ query });
        }
        res.status(200).json({ message: 'Queries added to the queue' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding queries to the queue' });
    }
};

duckduckgoQueue.process(async (job, done) => {
    const { query } = job.data;

    try {
        const results = await search(query);
        await saveFromDuckDuckGo(query, results.results);

        console.log(`Search results for query "${query}" processed and saved.`);
        done();
    } catch (error) {
        console.error(`Error processing search results for query "${query}":`, error);
        done(new Error(`Error processing search results for query "${query}"`));
    }
});

const saveFromeGG = async (query, items) => {
    try {
        // Kiểm tra xem từ khóa đã tồn tại trong database chưa
        const existingResults = await SearchResult.findOne({ keyword: query });
        if (existingResults) {
            console.log(`Search results for query "${query}" already exist in the database.`);
            return;
        }

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

        const existingResults = await SearchResult.findOne({ keyword: query });
        if (existingResults) {
            console.log(`Search results for query "${query}" already exist in the database.`);
            return;
        }

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
                return extractedContent; // Trả về nội dung đã trích xuất
            } catch (error) {
                console.error(`Error accessing or extracting content from ${item.url}:`, error);
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

