import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
// Import Leaflet directly from CDN instead of the package
// The CSS is already included in the index.html

const API_URL = 'http://localhost:8080';

export default function MapPage() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [temperatureData, setTemperatureData] = useState([]);
  const [waterPropertiesData, setWaterPropertiesData] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // New state for clicked coordinates
  const [clickedCoords, setClickedCoords] = useState(null);
  
  // Reference to map container
  const mapContainerRef = useRef(null);

  // Fetch the list of regions
  useEffect(() => {
    fetch(`${API_URL}/regions`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRegions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching regions:', err);
        setError('Failed to load regions. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Fetch temperature data
  useEffect(() => {
    fetch(`${API_URL}/regions/temperature`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => setTemperatureData(data))
      .catch(err => console.error('Error fetching temperature data:', err));
  }, []);

  // Fetch water properties data
  useEffect(() => {
    fetch(`${API_URL}/regions/water-properties`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => setWaterPropertiesData(data))
      .catch(err => console.error('Error fetching water properties data:', err));
  }, []);

  // Fetch species data whenever selected region changes
  useEffect(() => {
    const url = selectedRegion === 'all' 
      ? `${API_URL}/regions/species`
      : `${API_URL}/regions/species/${selectedRegion}`;
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => setSpeciesData(data))
      .catch(err => console.error('Error fetching species data:', err));
  }, [selectedRegion]);

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
  };

  const formatTemperature = (temp) => {
    return temp ? `${parseFloat(temp).toFixed(2)} °C` : 'N/A';
  };

  const formatValue = (value) => {
    return value ? parseFloat(value).toFixed(2) : 'N/A';
  };

  // Initialize the map
  useEffect(() => {
    // Make sure the Leaflet library is loaded from the CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = initializeMap;
    document.body.appendChild(script);
    
    function initializeMap() {
      // Check if map container exists and Leaflet is loaded
      if (mapContainerRef.current && window.L) {
        // Create the map
        const L = window.L;
        const map = L.map(mapContainerRef.current).setView([20, 0], 2);
        
        // Add the OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add the click event handler
        map.on('click', function(e) {
          setClickedCoords(e.latlng);
        });
      }
    }
    
    return () => {
      // Clean up script if component unmounts before script loads
      document.querySelectorAll('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]')
        .forEach(s => s.remove());
    };
  }, []);

  if (loading) return <div>Loading regions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="map-page">
      <h1>Ocean Regions Data</h1>
      
      <div className="region-selector">
        <label htmlFor="region-select">Select Ocean Region: </label>
        <select 
          id="region-select" 
          value={selectedRegion} 
          onChange={handleRegionChange}
        >
          <option value="all">All Regions</option>
          {regions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      <div className="data-section">
        <h2>Temperature Data</h2>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Average Temperature</th>
            </tr>
          </thead>
          <tbody>
            {temperatureData
              .filter(item => selectedRegion === 'all' || item.region_id === selectedRegion)
              .map(item => (
                <tr key={item.region_id}>
                  <td>{item.region_id
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}</td>
                  <td>{formatTemperature(item.avg_temperature)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="data-section">
        <h2>Water Properties</h2>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Average Salinity</th>
              <th>Average pH</th>
            </tr>
          </thead>
          <tbody>
            {waterPropertiesData
              .filter(item => selectedRegion === 'all' || item.region_id === selectedRegion)
              .map(item => (
                <tr key={item.region_id}>
                  <td>{item.region_id
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}</td>
                  <td>{formatValue(item.avg_salinity)}</td>
                  <td>{formatValue(item.avg_ph)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="data-section">
        <h2>Species in Region {selectedRegion === 'all' ? '(All Regions)' : 
          selectedRegion.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h2>
        {speciesData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Scientific Name</th>
              </tr>
            </thead>
            <tbody>
              {speciesData.slice(0, 100).map((item, index) => (
                <tr key={index}>
                  <td>{item.region_id
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}</td>
                  <td>{item.scientificName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No species data available for this region.</p>
        )}
        {speciesData.length > 100 && (
          <p>Showing 100 of {speciesData.length} species.</p>
        )}
      </div>

      <div className="data-section">
        <h2>Interactive World Map</h2>
        <div 
          id="map" 
          ref={mapContainerRef} 
          style={{ 
            height: '500px', 
            width: '100%', 
            margin: '20px 0',
            zIndex: 0 // Ensure map doesn't interfere with other elements
          }}
        ></div>
        
        {clickedCoords && (
          <div className="clicked-coords">
            <h3>Clicked Coordinates</h3>
            <p>Latitude: {clickedCoords.lat.toFixed(4)}</p>
            <p>Longitude: {clickedCoords.lng.toFixed(4)}</p>
          </div>
        )}
      </div>
    </div>
  );
}