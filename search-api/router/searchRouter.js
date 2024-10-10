const express = require('express');
const searchController = require('../controller/searchController'); 

const router = express.Router();

router.get('/google', searchController.googleSearch);
router.get('/duckduckgo', searchController.duckduckgoSearch);
router.get('/duckduckgo-scrape', searchController.duckduckgoScrapeSearch);
router.get('/getResult', searchController.getSearchResults);
router.get('/get-search-result', searchController.getMultipleSearchResults);


module.exports = router;
