import React, { useState, useEffect } from 'react';
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
  const [shiftsData, setShiftsData] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shiftsError, setShiftsError] = useState(null);
  const [shiftsFilter, setShiftsFilter] = useState({
    minCount: 10,
    oldStartDate: '2015-01-01', 
    oldEndDate: '2015-06-30', 
    newStartDate: '2015-07-01', 
    newEndDate: '2015-12-31'
  });

  const predefinedPeriods = [
    { 
      name: "Winter vs Summer", 
      oldStartDate: '2015-01-01', 
      oldEndDate: '2015-02-28', 
      newStartDate: '2015-06-01', 
      newEndDate: '2015-08-31' 
    },
    { 
      name: "Spring vs Fall", 
      oldStartDate: '2015-03-01', 
      oldEndDate: '2015-05-31', 
      newStartDate: '2015-09-01', 
      newEndDate: '2015-11-30' 
    },
    { 
      name: "First Half vs Second Half", 
      oldStartDate: '2015-01-01', 
      oldEndDate: '2015-06-30', 
      newStartDate: '2015-07-01', 
      newEndDate: '2015-12-31' 
    },
    { 
      name: "Q1 vs Q3", 
      oldStartDate: '2015-01-01', 
      oldEndDate: '2015-03-31', 
      newStartDate: '2015-07-01', 
      newEndDate: '2015-09-30' 
    }
  ];

  const applyPredefinedPeriod = (periodIndex) => {
    const period = predefinedPeriods[periodIndex];
    setShiftsFilter({
      ...shiftsFilter,
      oldStartDate: period.oldStartDate,
      oldEndDate: period.oldEndDate,
      newStartDate: period.newStartDate,
      newEndDate: period.newEndDate
    });
  };

  useEffect(() => {
    console.log('Current shifts filter:', shiftsFilter);
  }, [shiftsFilter]);

  const handleSearch = () => {
    if (!searchName) return;
    setLoading(true);
    setError(null);
    
    setShiftsData([]);
    setShiftsError(null);

    fetch(`${API_URL}/species/monthly-trends/${encodeURIComponent(searchName)}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMonthlyTrends(data);
        if (data.length === 0) {
          setError(`No data found for ${searchName} in 2015. Try another species name.`);
        }
      })
      .catch(err => {
        console.error('Error fetching monthly trends:', err);
        setError(`Failed to load data: ${err.message}`);
      })
      .finally(() => setLoading(false));
  };

  const handleFetchShifts = () => {
    if (!searchName) {
      setShiftsError('Please search for a species first to see its geographic shifts');
      return;
    }
    
    setLoadingShifts(true);
    setShiftsError(null);

    const formattedFilters = {
      ...shiftsFilter,
      oldStartDate: shiftsFilter.oldStartDate.substring(0, 10),
      oldEndDate: shiftsFilter.oldEndDate.substring(0, 10),
      newStartDate: shiftsFilter.newStartDate.substring(0, 10),
      newEndDate: shiftsFilter.newEndDate.substring(0, 10)
    };
    
    console.log('Fetching with params:', formattedFilters);
    
    const params = new URLSearchParams({
      minCount: formattedFilters.minCount,
      oldStartDate: formattedFilters.oldStartDate,
      oldEndDate: formattedFilters.oldEndDate,
      newStartDate: formattedFilters.newStartDate,
      newEndDate: formattedFilters.newEndDate,
      scientificName: searchName
    });
    
    fetch(`${API_URL}/species/shifts?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        setShiftsData(data);
        if (data.length === 0) {
          setShiftsError(`No geographic shifts found for ${searchName} with the current parameters. This species may not have enough observations (minimum ${shiftsFilter.minCount}) in both time periods selected.`);
        }
      })
      .catch(err => {
        console.error('Error fetching species shifts:', err);
        setShiftsError(`Failed to load shifts data: ${err.message}`);
      })
      .finally(() => setLoadingShifts(false));
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${parseFloat(num).toFixed(2)}%`;
  };

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined || temp === 0) return 'N/A';
    return `${parseFloat(temp).toFixed(2)} °C`;
  };
  
  const formatDistance = (dist) => {
    if (dist === null || dist === undefined) return 'N/A';
    return `${parseFloat(dist).toFixed(2)} km`;
  };

  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined) return 'N/A';
    return parseFloat(coord).toFixed(4);
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate());
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="species-page">
      <h1>Species Insights Dashboard</h1>
      <section className="global-species-selection">
        <h2>Learn insights about a marine species</h2>
        <p>
          Enter a scientific name to explore monthly occurrence patterns, temperature correlations, 
          and geographic movement for that species.
        </p>
        
        <div className="search-container" style={{ marginBottom: '30px' }}>
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Enter scientific name (e.g., Gadus morhua)"
            style={{ minWidth: '300px', padding: '10px' }}
          />
          <button onClick={handleSearch} disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Loading...' : 'Explore Species'}
          </button>
        </div>
        
        {error && <p className="error">{error}</p>}
      </section>
      
      {/* Monthly trends section */}
      {searchName && (
        <section>
          <h2>Monthly Occurrence Trends vs. Ocean Temperature (2015)</h2>
          <p>
            This analysis shows the relationship between monthly {searchName} observations and ocean 
            temperature from the World Ocean Database. See how the species' occurrence count changes 
            with temperature throughout the year.
          </p>
          
          {monthlyTrends.length > 0 ? (
            <div className="trends-results">
              <h3>Monthly Trends for {searchName} (2015)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Occurrences</th>
                    <th>% Change</th>
                    <th>Avg. Ocean Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrends.map(trend => (
                    <tr key={trend.month}>
                      <td>{monthNames[trend.month - 1]}</td>
                      <td>{formatNumber(trend.occ_count)}</td>
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
                  This data shows the monthly occurrence patterns of {searchName} throughout 2015,
                  alongside average ocean temperatures. Patterns may indicate seasonal migration,
                  breeding cycles, or sampling biases.
                </p>
                <p>
                  Temperature correlations can suggest whether a species is affected by seasonal
                  temperature changes, which may be important when considering climate change impacts.
                </p>
              </div>
            </div>
          ) : !error && (
            <p>Loading monthly trends data...</p>
          )}
        </section>
      )}
      
      {/* Geographic shifts section */}
      {searchName && (
        <section>
          <h2>Species Geographic Shifts Analysis (2015)</h2>
          <p>
            This analysis examines how <strong>{searchName}</strong> shifts geographically during different 
            parts of the year by calculating the centroid of observations in two different time periods.
          </p>
          
          <div className="shifts-filters">
            <h4>Configure Time Periods for {searchName}</h4>
            
            {/* Quick selection of predefined periods */}
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Quick select period:</strong></p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {predefinedPeriods.map((period, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => applyPredefinedPeriod(idx)}
                    style={{ padding: '8px', fontSize: '0.9rem' }}
                  >
                    {period.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
              <div>
                <p><strong>First Period (2015):</strong></p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="date"
                    min="2015-01-01"
                    max="2015-12-31"
                    value={shiftsFilter.oldStartDate}
                    onChange={e => setShiftsFilter({...shiftsFilter, oldStartDate: e.target.value})}
                    style={{ width: '150px' }}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    min="2015-01-01"
                    max="2015-12-31" 
                    value={shiftsFilter.oldEndDate}
                    onChange={e => setShiftsFilter({...shiftsFilter, oldEndDate: e.target.value})}
                    style={{ width: '150px' }}
                  />
                </div>
              </div>
              
              <div>
                <p><strong>Second Period (2015):</strong></p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="date"
                    min="2015-01-01"
                    max="2015-12-31"
                    value={shiftsFilter.newStartDate}
                    onChange={e => setShiftsFilter({...shiftsFilter, newStartDate: e.target.value})}
                    style={{ width: '150px' }}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    min="2015-01-01"
                    max="2015-12-31" 
                    value={shiftsFilter.newEndDate}
                    onChange={e => setShiftsFilter({...shiftsFilter, newEndDate: e.target.value})}
                    style={{ width: '150px' }}
                  />
                </div>
              </div>
              
              <div>
                <p><strong>Minimum Observations:</strong></p>
                <input
                  type="number"
                  min="1"
                  value={shiftsFilter.minCount}
                  onChange={e => setShiftsFilter({...shiftsFilter, minCount: parseInt(e.target.value) || 10})}
                  style={{ width: '70px' }}
                />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                  Lower this value if no results appear
                </p>
              </div>
            </div>
            
            <button onClick={handleFetchShifts} disabled={loadingShifts} style={{ padding: '10px 20px' }}>
              {loadingShifts ? 'Loading...' : 'Analyze Shifts'}
            </button>
          </div>
          
          {shiftsError && <p className="error">{shiftsError}</p>}
          
          {shiftsData.length > 0 && (
            <div className="shifts-results">
              <h3>Geographic Shifts for {searchName}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Time Period</th>
                    <th>First Period Centroid</th>
                    <th>Second Period Centroid</th>
                    <th>Shift Distance</th>
                    <th>Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftsData.map(shift => (
                    <tr key={shift.id}>
                      <td>{formatDateForDisplay(shiftsFilter.oldStartDate)} - {formatDateForDisplay(shiftsFilter.oldEndDate)} → {formatDateForDisplay(shiftsFilter.newStartDate)} - {formatDateForDisplay(shiftsFilter.newEndDate)}</td>
                      <td>
                        {formatCoordinate(shift.first_half_lat)}°N, {formatCoordinate(shift.first_half_lon)}°E
                      </td>
                      <td>
                        {formatCoordinate(shift.second_half_lat)}°N, {formatCoordinate(shift.second_half_lon)}°E
                      </td>
                      <td>{formatDistance(shift.shiftDist)}</td>
                      <td>{shift.first_half_count} → {shift.second_half_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="trends-summary">
                <h4>Interpretation</h4>
                <p>
                  This analysis shows how {searchName} shifts its geographic center between the two selected time periods,
                  potentially revealing seasonal migration patterns or habitat preferences.
                </p>
                <p>
                  The shift distance indicates how far the species' observed center has moved between the two time periods,
                  which can be useful for understanding the species' mobility and range.
                </p>
                <p>
                  <strong>Note:</strong> If you don't see results, try:
                </p>
                <ul>
                  <li>Selecting different date ranges</li>
                  <li>Reducing the minimum observation count</li>
                  <li>Checking if the species has sufficient data in both periods</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}