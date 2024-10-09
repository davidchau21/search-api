const express = require('express');
const cors = require('cors');
const searchRouter = require('./router/searchRouter'); // Import router
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Sử dụng router cho các route tìm kiếm
app.use('/search', searchRouter);

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
.catch((error) => console.error('MongoDB connection error:', error));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
