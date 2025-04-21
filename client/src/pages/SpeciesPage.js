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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const cleanDateString = dateString.split('T')[0];
    const [year, month, day] = cleanDateString.split('-').map(num => parseInt(num, 10));
    if (!year || !month || !day) return 'N/A';
    
    return `${month}/${day}/${year}`;
  };

  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined) return 'N/A';
    return parseFloat(coord).toFixed(4);
  };

  const formatRegion = (regionId) => {
    if (!regionId) return 'Unknown';
    return regionId
      .replace(/([A-Z])/g, ' $1') 
      .replace(/^./, str => str.toUpperCase());
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
                  <td>{s.scientificName}</td>
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
                <th>Scientific Name</th>
                <th>Region</th>
                <th>Observation Date</th>
                <th>Longitude</th>
                <th>Latitude</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.scientificName}</td>
                  <td>{formatRegion(row.region_id)}</td>
                  <td>{formatDate(row.eventDate)}</td>
                  <td>{formatCoordinate(row.longitude)}</td>
                  <td>{formatCoordinate(row.latitude)}</td>
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