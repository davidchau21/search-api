const express = require('express');
const SerpApi = require('google-search-results-nodejs');
const app = express();
const port = 3001;
const cors = require('cors');

// Sử dụng CORS
app.use(cors());

// Thay API key của bạn vào đây
const apiKey = '70d7196144ab824219fa5bb174ecce64b3b3924f4bee6f84502da946654789a1';

// Tạo instance SerpApi
const search = new SerpApi.GoogleSearch(apiKey);

app.use(express.json());

// API tìm kiếm với SerpApi
app.get('/search/google', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const params = {
    q: query,
    location: 'Vietnam',
    hl: 'en', // Ngôn ngữ tìm kiếm
  };

  search.json(params, (result) => {
    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
