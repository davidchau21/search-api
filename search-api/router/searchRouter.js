const express = require('express');
const searchController = require('../controller/searchController'); 

const router = express.Router();

// Định nghĩa các route cho tìm kiếm
router.get('/google', searchController.googleSearch);
router.get('/duckduckgo', searchController.duckduckgoSearch);
router.get('/duckduckgo-scrape', searchController.duckduckgoScrapeSearch);

module.exports = router;
