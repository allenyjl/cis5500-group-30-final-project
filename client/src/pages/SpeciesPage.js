import React, { useState, useEffect } from 'react';
import AdvancedSpeciesSearch from '../components/AdvancedSpeciesSearch';

const API_URL = 'http://localhost:8080';

export default function SpeciesPage() {
  const [topSpecies, setTopSpecies] = useState([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [habitatCounts, setHabitatCounts] = useState([]);
  const [loadingHabitat, setLoadingHabitat] = useState(false);
  const [speciesByMonth, setSpeciesByMonth] = useState([]);
  const [loadingByMonth, setLoadingByMonth] = useState(false);
  const [cooccurrenceData, setCooccurrenceData] = useState([]);
  const [loadingCooccurrence, setLoadingCooccurrence] = useState(false);
  const [randomSpecies, setRandomSpecies] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

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

