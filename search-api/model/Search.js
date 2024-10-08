const mongoose = require('mongoose');

const searchResultSchema = new mongoose.Schema({
    keyword: { type: String, required: true },
    results: [
        {
            url: { type: String, required: true }, // URL của bài viết
            title: { type: String, required: true }, // Tiêu đề bài viết
            description: { type: String }, // Mô tả ngắn về bài viết
            image: { type: String }, // URL hình ảnh đại diện
            author: { type: String }, // Tác giả của bài viết
            favicon: { type: String }, // URL favicon của trang
            content: { type: String }, // Nội dung chính của bài viết
            published: { type: Date }, // Thời gian xuất bản
            type: { type: String }, // Loại trang (ví dụ: article, blog, etc.)
            source: { type: String }, // Nhà xuất bản gốc
            links: { type: [String] }, // Danh sách các liên kết thay thế
            ttr: { type: Number }, // Thời gian đọc ước tính (tính bằng giây)
        }
    ]
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

const SearchResult = mongoose.model('SearchResult', searchResultSchema);

module.exports = SearchResult;
