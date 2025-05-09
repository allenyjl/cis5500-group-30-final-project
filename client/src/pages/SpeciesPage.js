import React, { useState, useEffect } from 'react';
import AdvancedSpeciesSearch from '../components/AdvancedSpeciesSearch';

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
  const [habitatCounts, setHabitatCounts] = useState([]);
const [loadingHabitat, setLoadingHabitat] = useState(false);
const [speciesByMonth, setSpeciesByMonth] = useState([]);
const [loadingByMonth, setLoadingByMonth] = useState(false);
const [cooccurrenceData, setCooccurrenceData] = useState([]);
const [loadingCooccurrence, setLoadingCooccurrence] = useState(false);
const [randomSpecies, setRandomSpecies] = useState([]);
const [loadingRandom, setLoadingRandom] = useState(false);

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


  setLoadingHabitat(true);
  fetch(`${API_URL}/species/habitat-counts`)
    .then(res => res.json())
    .then(data => setHabitatCounts(data))
    .catch(err => console.error(err))
    .finally(() => setLoadingHabitat(false));

    setLoadingByMonth(true);
fetch(`${API_URL}/species/by-month`)
  .then(res => res.json())
  .then(data => setSpeciesByMonth(data))
  .catch(err => console.error(err))
  .finally(() => setLoadingByMonth(false));
  setLoadingCooccurrence(true);
  fetch(`${API_URL}/species/cooccurrence`)
    .then(res => res.json())
    .then(data => setCooccurrenceData(data))
    .catch(err => console.error(err))
    .finally(() => setLoadingCooccurrence(false));
    

}, []);
const handleFetchRandomSpecies = () => {
  setLoadingRandom(true);
  fetch(`${API_URL}/species/random`)
    .then(res => res.json())
    .then(data => setRandomSpecies(data))
    .catch(err => console.error(err))
    .finally(() => setLoadingRandom(false));
};
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
        <h2>Species by Habitat Type</h2>
        {loadingHabitat ? (
          <p>Loading habitat counts...</p>
        ) : habitatCounts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Habitat Type</th>
                <th>Species Count</th>
              </tr>
            </thead>
            <tbody>
              {habitatCounts.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.habitat_type}</td>
                  <td>{item.species_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No habitat count data available.</p>
        )}
      </section>

      <section>
        <h2>Species Observations by Month</h2>
        {loadingByMonth ? (
          <p>Loading monthly data...</p>
        ) : speciesByMonth.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Observation Count</th>
              </tr>
            </thead>
            <tbody>
              {speciesByMonth.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.month}</td>
                  <td>{item.observation_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No monthly observation data available.</p>
        )}
      </section>

      <section>
        <h2>Top Species Co-occurrences</h2>
        {loadingCooccurrence ? (
          <p>Loading co-occurrence data...</p>
        ) : cooccurrenceData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Species A</th>
                <th>Species B</th>
                <th>Times Together</th>
              </tr>
            </thead>
            <tbody>
              {cooccurrenceData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.species_a}</td>
                  <td>{item.species_b}</td>
                  <td>{item.times_together}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No co-occurrence data available.</p>
        )}
      </section>

      <section>
        <h2>Want to explore a new species? Generate a random species!</h2>
        <button onClick={handleFetchRandomSpecies}>Get Random Species</button>
        {loadingRandom ? (
          <p>Loading random species...</p>
        ) : randomSpecies.length > 0 ? (
          <table style={{ marginTop: '15px' }}>
            <thead>
              <tr>
                <th>Scientific Name</th>
                <th>Observation Count</th>
                <th>% of Total</th>
                <th>Rarity Score</th>
              </tr>
            </thead>
            <tbody>
              {randomSpecies.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.scientificName}</td>
                  <td>{item.observation_count}</td>
                  <td>{parseFloat(item.percentage_of_total).toFixed(6)}%</td>
                  <td>{parseFloat(item.rarity_score).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No random species yet. Click the button above to discover!</p>
        )}
      </section>

      <section>
        <AdvancedSpeciesSearch />
      </section>
    </div>
  );
}

