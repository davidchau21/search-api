const { JSDOM } = require('jsdom');
const axios = require('axios');

const extractJsDom = async (url) => {
  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    
    // Trích xuất tiêu đề
    const title = dom.window.document.querySelector('title')?.textContent || 'Không có tiêu đề';

    // Trích xuất nội dung chính - có thể điều chỉnh selector cho phù hợp với trang web cụ thể
    const content = dom.window.document.querySelector('article')?.innerHTML || 
                    dom.window.document.querySelector('main')?.innerHTML || 
                    dom.window.document.body.innerHTML || 
                    'Không có nội dung';

    // Trích xuất mô tả
    const description = dom.window.document.querySelector('meta[name="description"]')?.content || 'Không có mô tả';

    // Trích xuất tác giả
    const author = dom.window.document.querySelector('meta[name="author"]')?.content || 'Không có tác giả';

    // Trích xuất thời gian xuất bản
    const publishedTime = dom.window.document.querySelector('meta[property="article:published_time"]')?.content || 
                          dom.window.document.querySelector('time')?.dateTime || 
                          'Không có thời gian xuất bản';

    // Trích xuất hình ảnh chính
    const image = dom.window.document.querySelector('meta[property="og:image"]')?.content || 
                  dom.window.document.querySelector('img')?.src || 
                  null;

    // Trích xuất các link
    const links = Array.from(dom.window.document.querySelectorAll('a')).map(link => link.href);

    return {
      title,
      content,
      description,
      author,
      publishedTime,
      image,
      url,
      links,
    };
  } catch (error) {
    console.error(`Lỗi khi trích xuất nội dung từ ${url}:`, error);
    return null; // Trả về null nếu việc trích xuất thất bại
  }
};  

module.exports = extractJsDom;
