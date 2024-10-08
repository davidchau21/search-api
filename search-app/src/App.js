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
      setError(error.response?.data?.message || "Something went wrong with Google search");
    } finally {
      setLoading(false);
    }
  };


  // Search using DuckDuckGo API (không hỗ trợ phân trang)
  // const handleSearchDuckDuckGo = async () => {
  //   if (!url) {
  //     setError("Search term is required");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await axios.get(
  //       `http://localhost:3001/search/duckduckgo?query=${url}`
  //     );

  //     setDuckDuckGoResults(response.data.RelatedTopics || []);
  //     console.log("DuckDuckGo response: ", response);
  //   } catch (error) {
  //     setError(error.response?.data?.message || "Something went wrong with DuckDuckGo search");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
      setError(error.response?.data?.message || "Something went wrong with DuckDuckGo search");
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

      <button onClick={() => handleSearchGoogle(1)} style={{ margin: "10px 12px" }}>
        Search Google
      </button>

      {/* <button onClick={handleSearchDuckDuckGo} style={{ margin: "10px 0" }}>
        Search DuckDuckGo
      </button> */}

      <button onClick={handleSearchDuckDuckGoScrape} style={{ margin: "10px 0" }}>
        Search DuckDuckGo (Scrape)
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display Google Search Results */}
      {/* Display Google Search Results */}
      <div>
        <h3>Google Search Results:</h3>
        <p>Showing results from {currentStart} to {currentStart + googleResults.length - 1}</p>
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
            <button onClick={() => handleSearchGoogle(previousPage)} style={{ margin: "5px" }}>
              Previous
            </button>
          )}
          {nextPage && (
            <button onClick={() => handleSearchGoogle(nextPage)} style={{ margin: "5px" }}>
              Next
            </button>
          )}
        </div>
      </div>


      {/* Display DuckDuckGo Search Results */}
      {/* <div>
        <h3>DuckDuckGo Search Results:</h3>
        <ul>
          {duckDuckGoResults.map((result, index) => (
            <li key={index} style={{ marginBottom: "15px" }}>
              <a href={result.FirstURL} target="_blank" rel="noopener noreferrer">
                <h4>{result.Text}</h4>
              </a>
              <small>{result.FirstURL}</small>
            </li>
          ))}
        </ul>
      </div> */}

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

    </div>
  );
}

export default App;
