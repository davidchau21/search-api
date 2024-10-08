const axios = require('axios');

const extractContentFromUrl = async (url) => {
    try {
      const response = await axios.get(url);
  
      // Dynamic import
      const { extractFromHtml } = await import('@extractus/article-extractor');
  
      const extractedData = await extractFromHtml(response.data, url);
  
      // Check if extractedData is valid
      if (!extractedData) {
        console.warn(`No data extracted from ${url}`);
        return null; // Return null to signify extraction failure
      }
  
      // Destructure with defaults to avoid undefined errors
      return {
        title: extractedData.title || 'No title',
        content: extractedData.content || 'No content',
        image: extractedData.image || null,
        url: extractedData.url || url,
        description: extractedData.description || null,
        author: extractedData.author || null,
        published: extractedData.published || null,
        favicon: extractedData.favicon || null,
        type: extractedData.type || null,
        source: extractedData.source || null,
        links: extractedData.links || [],
        ttr: extractedData.ttr || 0,
      };
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      return null; // Return null if extraction fails
    }
  };
  

module.exports = extractContentFromUrl;
