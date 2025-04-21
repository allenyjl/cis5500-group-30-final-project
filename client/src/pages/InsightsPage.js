import React, { useState } from 'react';
import '../App.css';

const API_URL = 'http://localhost:8080';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function InsightsPage() {
  const [searchName, setSearchName] = useState('');
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = () => {
    if (!searchName) return;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/species/monthly-trends/${encodeURIComponent(searchName)}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMonthlyTrends(data);
        if (data.length === 0) {
          setError(`No data found for ${searchName} in 2023. Try another species name.`);
        }
      })
      .catch(err => {
        console.error('Error fetching monthly trends:', err);
        setError(`Failed to load data: ${err.message}`);
      })
      .finally(() => setLoading(false));
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) return 'N/A';
    return `${parseFloat(temp).toFixed(2)} °C`;
  };

  return (
    <div className="species-page">
      <h1>Species Monthly Trends & Temperature Insights</h1>
      
      <section>
        <h2>Monthly Occurrence Trends vs. Ocean Temperature (2023)</h2>
        <p>
          This analysis shows the relationship between monthly species observations and ocean 
          temperature from the World Ocean Database. Enter a scientific name to see how the 
          species' occurrence count changes with temperature throughout the year.
        </p>
        
        <div className="search-container">
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Enter scientific name (e.g., Gadus morhua)"
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
        
        {error && <p className="error">{error}</p>}
        
        {monthlyTrends.length > 0 && (
          <div className="trends-results">
            <h3>Monthly Trends for {searchName} (2015)</h3>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Occurrences</th>
                  <th>Previous Month</th>
                  <th>% Change</th>
                  <th>Avg. Ocean Temp</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map(trend => (
                  <tr key={trend.month}>
                    <td>{monthNames[trend.month - 1]}</td>
                    <td>{formatNumber(trend.occ_count)}</td>
                    <td>{formatNumber(trend.prev_count)}</td>
                    <td className={trend.pct_change > 0 ? 'positive-change' : trend.pct_change < 0 ? 'negative-change' : ''}>
                      {formatPercentage(trend.pct_change)}
                    </td>
                    <td>{formatTemperature(trend.avg_wod_temp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="trends-summary">
              <h4>Insights</h4>
              <p>
                This data shows the monthly occurrence patterns of {searchName} throughout 2023,
                alongside average ocean temperatures. Patterns may indicate seasonal migration,
                breeding cycles, or sampling biases.
              </p>
              <p>
                Temperature correlations can suggest whether a species is affected by seasonal
                temperature changes, which may be important when considering climate change impacts.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}