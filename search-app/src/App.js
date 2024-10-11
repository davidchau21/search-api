import React, { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [googleResults, setGoogleResults] = useState([]);
  // const [duckDuckGoResults, setDuckDuckGoResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duckDuckGoScrapeResults, setDuckDuckGoScrapeResults] = useState([]);

  // Phân trang state cho Google
  const [currentStart, setCurrentStart] = useState(1); // Bắt đầu từ trang đầu tiên
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [video, setVideo] = useState([]);

  // Search using Google API
  const handleSearchGoogle = async (start = 1) => {
    if (!url) {
      setError("Search term is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:3001/search/google?query=${url}&start=${start}`
      );

      // Cập nhật kết quả tìm kiếm Google
      setGoogleResults(response.data.items || []);

      // Cập nhật phân trang từ metadata
      setNextPage(response.data.nextPage || null);
      setPreviousPage(response.data.previousPage || null);
      setCurrentStart(start);

      console.log("Google response: ", response);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong with Google search"
      );
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm với DuckDuckGo (duck-duck-scrape)
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchDuckDuckGoScrape = async (page = 1) => {
    if (!url) {
      setError("Search term is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:3001/search/duckduckgo-scrape?query=${url}&page=${page}`
      );

      setDuckDuckGoScrapeResults(response.data.results || []);
      setCurrentPage(page); // Cập nhật trang hiện tại
      console.log("DuckDuckGo Scrape response: ", response);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong with DuckDuckGo search"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    handleSearchDuckDuckGoScrape(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handleSearchDuckDuckGoScrape(currentPage - 1);
    }
  };

  // hàm xử lý tìm kiếm video
  const handleSearchVideo = async () => {
    if (!url) {
      setError("Search term is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:3001/search/search-video?query=${url}`
      );

      setVideo(response.data.items || []);
      console.log("Video response: ", response);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong with Video search"
      );
    } finally {
      setLoading(false);
    }
  };

  const [image, setImage] = useState([]);
  // hàm tìm kiếm ảnh
  const handleSearchImage = async () => {
    if (!url) {
      setError("Search term is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:3001/search/search-image?query=${url}`
      );

      setImage(response.data.items || []);
      console.log("Image response: ", response);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong with Image search"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Search Results</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter Search Term"
        style={{ padding: "10px", width: "80%" }}
      />

      <button
        onClick={() => handleSearchGoogle(1)}
        style={{ margin: "10px 12px" }}
      >
        Search Google
      </button>

      <button
        onClick={handleSearchDuckDuckGoScrape}
        style={{ margin: "10px 0" }}
      >
        Search DuckDuckGo (Scrape)
      </button>

      <button onClick={handleSearchVideo} style={{ margin: "10px 0" }}>
        Search Video
      </button>

      <button onClick={handleSearchImage} style={{ margin: "10px 0" }}>
        Search Image
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display Google Search Results */}
      <div>
        <h3>Google Search Results:</h3>
        <p>
          Showing results from {currentStart} to{" "}
          {currentStart + googleResults.length - 1}
        </p>
        <ul>
          {googleResults.map((result, index) => (
            <li key={index} style={{ marginBottom: "15px" }}>
              <a href={result.link} target="_blank" rel="noopener noreferrer">
                <h4>{result.title}</h4>
              </a>
              <p>{result.snippet}</p>
              <small>{result.link}</small>
            </li>
          ))}
        </ul>

        {/* Pagination Controls for Google Search */}
        <div>
          {previousPage && (
            <button
              onClick={() => handleSearchGoogle(previousPage)}
              style={{ margin: "5px" }}
            >
              Previous
            </button>
          )}
          {nextPage && (
            <button
              onClick={() => handleSearchGoogle(nextPage)}
              style={{ margin: "5px" }}
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Display DuckDuckGo Scrape Search Results */}
      <div>
        <h3>DuckDuckGo Scrape Search Results:</h3>
        <ul>
          {duckDuckGoScrapeResults.map((result, index) => (
            <li key={index} style={{ marginBottom: "15px" }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <h4>{result.title}</h4>
              </a>
              <p>{result.snippet}</p>
              <small>{result.url}</small>
              <p dangerouslySetInnerHTML={{ __html: result.description }}></p>
            </li>
          ))}
        </ul>

        {/* Pagination Controls for DuckDuckGo Scrape Search */}
        <div>
          {currentPage > 1 && (
            <button onClick={handlePreviousPage} style={{ margin: "5px" }}>
              Previous
            </button>
          )}
          {duckDuckGoScrapeResults.length > 0 && (
            <button onClick={handleNextPage} style={{ margin: "5px" }}>
              Next
            </button>
          )}
        </div>
      </div>

      {/* Display Video Search Results */}
      <div>
        <h3>Video Search Results:</h3>
        <ul>
          {video.map((result, index) => (
            <li key={index} style={{ marginBottom: "15px" }}>
              <a
                href={`https://www.youtube.com/watch?v=${result.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h4>{result.snippet.title}</h4>
              </a>
              <p>{result.snippet.description}</p>
              <small>{result.snippet.channelTitle}</small>
              <p>
                Published at:{" "}
                {new Date(result.snippet.publishedAt).toLocaleDateString()}
              </p>
              <img
                src={result.snippet.thumbnails.default.url}
                alt={result.snippet.title}
                width="120"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Display Image Search Results */}
      <div>
        <h3>Image Search Results:</h3>
        <ul>
          {image.map((result, index) => (
            <li key={index} style={{ marginBottom: "15px" }}>
              <a
                href={result.image.contextLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h4>{result.title}</h4>
              </a>
              <p>{result.snippet}</p>
              <small>{result.displayLink}</small>
              <p>
                File format: {result.mime} | Size:{" "}
                {Math.round(result.image.byteSize / 1024)} KB
              </p>
              <p>
                Dimensions: {result.image.width}x{result.image.height}
              </p>
              <img
                src={result.image.thumbnailLink}
                alt={result.title}
                width={result.image.thumbnailWidth}
                height={result.image.thumbnailHeight}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
