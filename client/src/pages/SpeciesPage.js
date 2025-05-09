import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080';

export default function SpeciesPage() {
  const [topSpecies, setTopSpecies] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [speciesDetail, setSpeciesDetail] = useState(null);
  const [speciesShifts, setSpeciesShifts] = useState([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [advancedResults, setAdvancedResults] = useState([]);
const [advancedFilters, setAdvancedFilters] = useState({
  scientificName: '',
  marine: false,
  brackish: false,
  minSightings: '',
  maxSightings: '',
  minDepth: '',
  maxDepth: '',
  minTemperature: '',
  maxTemperature: '',
});
const handleAdvancedSearch = () => {
  setLoadingAdvanced(true);
  const params = new URLSearchParams();

  Object.entries(advancedFilters).forEach(([key, value]) => {
    if (value !== '' && value !== false) {
      params.append(key, value);
    }
  });

  fetch(`${API_URL}/search_species?${params.toString()}`)
    .then(res => res.json())
    .then(data => setAdvancedResults(data))
    .catch(err => console.error(err))
    .finally(() => setLoadingAdvanced(false));
};
const [loadingAdvanced, setLoadingAdvanced] = useState(false);

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

  const handleFetchDetail = (id) => {
    setLoadingDetail(true);
    fetch(`${API_URL}/species/${id}`)
      .then(res => res.json())
      .then(data => setSpeciesDetail(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingDetail(false));
  };

  const handleFetchShifts = () => {
    setLoadingShifts(true);
    fetch(`${API_URL}/species/shifts`)
      .then(res => res.json())
      .then(data => setSpeciesShifts(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingShifts(false));
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
        {loadingTop ? <p>Loading...</p> : (
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
                <th>Date</th>
                <th>Longitude</th>
                <th>Latitude</th>
                <th>Actions</th>
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
                  <td>
                    <button onClick={() => handleFetchDetail(row.id)}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          searchName && <p>No results found.</p>
        )}
      </section>

      {speciesDetail && (
        <section>
          <h2>Species Details</h2>
          {loadingDetail ? (
            <p>Loading details...</p>
          ) : (
            <div>
              <p><strong>Scientific Name:</strong> {speciesDetail.scientificName}</p>
              <p><strong>Family:</strong> {speciesDetail.family}</p>
              <p><strong>Marine:</strong> {speciesDetail.marine ? 'Yes' : 'No'}</p>
              <p><strong>Brackish:</strong> {speciesDetail.brackish ? 'Yes' : 'No'}</p>
              <p><strong>Average Depth:</strong> {speciesDetail.averageDepth}</p>
              <p><strong>Average Temperature:</strong> {speciesDetail.averageTemperature}</p>
              <p><strong>Top Regions:</strong> {speciesDetail.topRegions.join(', ')}</p>
            </div>
          )}
        </section>
      )}
      <section>
  <h2>Advanced Species Search</h2>
  <p style={{ marginBottom: '10px' }}>
    Use the filters below to narrow down species results by name, environment, sightings, depth, or temperature.
  </p>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
    <div>
      <label>Scientific Name</label>
      <input
        type="text"
        value={advancedFilters.scientificName}
        onChange={e => setAdvancedFilters({ ...advancedFilters, scientificName: e.target.value })}
        style={{ width: '100%' }}
      />
    </div>

    <div style={{ display: 'flex', gap: '20px' }}>
      <label>
        <input
          type="checkbox"
          checked={advancedFilters.marine}
          onChange={e => setAdvancedFilters({ ...advancedFilters, marine: e.target.checked })}
        /> Marine
      </label>
      <label>
        <input
          type="checkbox"
          checked={advancedFilters.brackish}
          onChange={e => setAdvancedFilters({ ...advancedFilters, brackish: e.target.checked })}
        /> Brackish
      </label>
    </div>

    <div>
      <label>Max Sightings</label>
      <input
        type="number"
        value={advancedFilters.maxSightings}
        onChange={e => setAdvancedFilters({ ...advancedFilters, maxSightings: e.target.value })}
        style={{ width: '100%' }}
      />
    </div>

    <div style={{ display: 'flex', gap: '10px' }}>
      <div style={{ flex: 1 }}>
        <label>Min Depth</label>
        <input
          type="number"
          value={advancedFilters.minDepth}
          onChange={e => setAdvancedFilters({ ...advancedFilters, minDepth: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label>Max Depth</label>
        <input
          type="number"
          value={advancedFilters.maxDepth}
          onChange={e => setAdvancedFilters({ ...advancedFilters, maxDepth: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>
    </div>

    <div style={{ display: 'flex', gap: '10px' }}>
      <div style={{ flex: 1 }}>
        <label>Min Temp</label>
        <input
          type="number"
          value={advancedFilters.minTemperature}
          onChange={e => setAdvancedFilters({ ...advancedFilters, minTemperature: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label>Max Temp</label>
        <input
          type="number"
          value={advancedFilters.maxTemperature}
          onChange={e => setAdvancedFilters({ ...advancedFilters, maxTemperature: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>
    </div>

    <button onClick={handleAdvancedSearch} style={{ marginTop: '10px', alignSelf: 'flex-start' }}>
      Search
    </button>
  </div>

  {loadingAdvanced ? (
    <p>Loading advanced search...</p>
  ) : advancedResults.length > 0 ? (
    <table style={{ marginTop: '15px' }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Scientific Name</th>
        </tr>
      </thead>
      <tbody>
        {advancedResults.map((item, idx) => (
          <tr key={idx}>
            <td>{item.id}</td>
            <td>{item.scientificName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p style={{ marginTop: '10px' }}>No advanced results yet.</p>
  )}
</section>


      
    </div>
  );
}
