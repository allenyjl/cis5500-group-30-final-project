import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080';

export default function SpeciesPage() {
  const [topSpecies, setTopSpecies] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    setLoadingTop(true);
    fetch(`${API_URL}/species/most-observed`)
      .then(res => res.json())
      .then(data => setTopSpecies(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingTop(false));
  }, []);

  const handleSearch = () => {
    if (!searchName) return;
    setLoadingSearch(true);
    fetch(`${API_URL}/species/name/${encodeURIComponent(searchName)}`)
      .then(res => res.json())
      .then(data => setSearchResults(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingSearch(false));
  };

  return (
    <div className="species-page">
      <h1>Species Page</h1>
      <section>
        <h2>Top 10 Most Observed Species</h2>
        {loadingTop ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Scientific Name</th>
                <th>Observations</th>
              </tr>
            </thead>
            <tbody>
              {topSpecies.map((s, i) => (
                <tr key={i}>
                  <td>{s.scientificname}</td>
                  <td>{s.obs_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section>
        <h2>Search Species by Scientific Name</h2>
        <input
          type="text"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          placeholder="Enter scientific name"
        />
        <button onClick={handleSearch}>Search</button>
        {loadingSearch ? (
          <p>Searching...</p>
        ) : searchResults.length > 0 ? (
          <table>
            <thead>
              <tr>
                {Object.keys(searchResults[0]).map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchResults.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          searchName && <p>No results found.</p>
        )}
      </section>
    </div>
  );
}