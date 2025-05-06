import React, { useState, useEffect, useRef } from 'react';
import '../App.css';


const API_URL = 'http://localhost:8080';

const regionBounds = {
  northPacific_west: {
    id: 'northPacific_west',
    name: 'North Pacific (West)',
    minLat: 0.0,
    maxLat: 66.5,
    minLon: 120.0,
    maxLon: 180.0,
  },
  northPacific_east: {
    id: 'northPacific_east',
    name: 'North Pacific (East)',
    minLat: 0.0,
    maxLat: 66.5,
    minLon: -180.0,
    maxLon: -120.0,
  },
  southPacific_west: {
    id: 'southPacific_west',
    name: 'South Pacific (West)',
    minLat: -60.0,
    maxLat: 0.0,
    minLon: 120.0,
    maxLon: 180.0,
  },
  southPacific_east: {
    id: 'southPacific_east',
    name: 'South Pacific (East)',
    minLat: -60.0,
    maxLat: 0.0,
    minLon: -180.0,
    maxLon: -70.0,
  },
  northAtlantic: {
    id: 'northAtlantic',
    name: 'North Atlantic',
    minLat: 0.0,      // Equator
    maxLat: 66.5,     // Arctic Circle
    minLon: -70.0,    // 70° W
    maxLon: 20.0,     // 20° E
  },
  southAtlantic: {
    id: 'southAtlantic',
    name: 'South Atlantic',
    minLat: -60.0,
    maxLat: 0.0,
    minLon: -70.0,
    maxLon: 20.0,
  },
  indianOcean: {
    id: 'indianOcean',
    name: 'Indian Ocean',
    minLat: -60.0,
    maxLat: 30.0,
    minLon: 20.0,
    maxLon: 146.5,
  },
  arcticOcean: {
    id: 'arcticOcean',
    name: 'Arctic Ocean',
    minLat: 66.5,
    maxLat: 90.0,
    minLon: -180.0,
    maxLon: 180.0,
  },
  southernOcean: {
    id: 'southernOcean',
    name: 'Southern Ocean',
    minLat: -90.0,
    maxLat: -60.0,
    minLon: -180.0,
    maxLon: 180.0,
  },
};

export default function MapPage() {
  const [clickedCoords, setClickedCoords] = useState(null);
  const [detectedRegion, setDetectedRegion] = useState(null);
  const [obisEntries, setObisEntries] = useState([]);
  const [climateData, setClimateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);


  const detectOceanRegion = (lat, lng) => {
    const normLng = lng < -180 ? lng + 360 : lng > 180 ? lng - 360 : lng;
    
    for (const [regionKey, region] of Object.entries(regionBounds)) {
      if (
        lat >= region.minLat && 
        lat <= region.maxLat && 
        normLng >= region.minLon && 
        normLng <= region.maxLon
      ) {
        return {
          id: regionKey,
          name: regionKey
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase()),
          bounds: region
        };
      }
    }
    return null;
  };


  const fetchObisData = (lat, lng) => {
    setLoading(true);
    setObisEntries([]);
    setClimateData(null);
    setError(null);

    fetch(`${API_URL}/obis/coordinates/${lat}/${lng}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("No ocean region found at these coordinates");
          }
          throw new Error(`Server returned ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setObisEntries(data.obisEntries || []);
        setClimateData(data.climate || null);
        setDetectedRegion(data.region || null);
      })
      .catch(err => {
        console.error('Error fetching OBIS data:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const formatTemperature = (temp) => {
    return temp ? `${parseFloat(temp).toFixed(2)} °C` : 'N/A';
  };

  const formatValue = (value) => {
    return value ? parseFloat(value).toFixed(2) : 'N/A';
  };

  const formatDayOfYear = (dayOfYear) => {
    if (!dayOfYear) return 'N/A';
    
    const date = new Date(new Date().getFullYear(), 0, parseInt(dayOfYear));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? 'N/A' : date.toLocaleDateString();
  };

  // Initialize the map
  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.style.height = '500px';
      mapContainerRef.current.style.width = '100%';
      mapContainerRef.current.style.display = 'block';
    }
    
    if (mapInstanceRef.current) return;
    
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCSS.crossOrigin = '';
      document.head.appendChild(leafletCSS);
    }
    
    function initializeMap() {
      if (!mapContainerRef.current || !window.L) return;
      
      try {
        console.log("Initializing map...");
        const L = window.L;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [20, 0],
          zoom: 2,
          minZoom: 1
        });
        
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', function(e) {
          const { lat, lng } = e.latlng;
          console.log(`Clicked at: ${lat}, ${lng}`);
          setClickedCoords(e.latlng);
          
          fetchObisData(lat, lng);
        });
        
        setTimeout(() => {
          map.invalidateSize(true);
        }, 500);
        
        console.log("Map initialized successfully");
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to load map. Please try refreshing the page.');
      }
    }
    
    if (window.L) {
      console.log("Leaflet already loaded, initializing map");
      setTimeout(initializeMap, 100);
    } else {
      console.log("Loading Leaflet script");
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';

      script.async = false;
      script.onload = () => {
        console.log("Leaflet script loaded");

        setTimeout(initializeMap, 100);
      };
      script.onerror = () => {
        console.error("Failed to load Leaflet script");
        setError('Failed to load map library. Please check your internet connection and try again.');
      };
      document.body.appendChild(script);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  
  useEffect(() => {
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        console.log('Forcing map resize...');
        mapInstanceRef.current.invalidateSize(true);
      }
    }, 1000);

    return () => clearTimeout(resizeTimer);
  }, []);

  return (
    <div className="map-page">
      <h1>Interactive Ocean Map</h1>
      
      <div className="map-section">
        <h2>Click on a point to view OBIS data from 2015</h2>
        <p>Click anywhere on the map to see marine species and climate data for that region</p>
        <div className="map-container" style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
          <div 
            id="map" 
            ref={mapContainerRef} 
            style={{ 
              height: '500px', 
              width: '70%', 
              minHeight: '400px',
              margin: '20px 0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              position: 'relative',
              backgroundColor: '#f0f0f0',
              overflow: 'hidden'
            }}
          ></div>
          
          <div className="map-info" style={{ width: '30%' }}>
            {clickedCoords && (
              <div className="clicked-info">
                <h3>Selected Location</h3>
                <p>Latitude: {clickedCoords.lat.toFixed(4)}</p>
                <p>Longitude: {clickedCoords.lng.toFixed(4)}</p>
                <h3>Ocean Region</h3>
                {detectedRegion ? (
                  <p>{detectedRegion.name}</p>
                ) : loading ? (
                  <p>Detecting region...</p>
                ) : (
                  <p>No ocean region detected at this location</p>
                )}
              </div>
            )}
            {!clickedCoords && (
              <div className="instructions">
                <h3>Instructions</h3>
                <p>Click anywhere on the map to view marine species observations and climate data for that region.</p>
              </div>
            )}
            {error && (
              <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Climate Data Summary */}
      {climateData && (
        <div className="data-section">
          <h2>Climate Data Summary</h2>
          {loading ? (
            <p>Loading climate data...</p>
          ) : (
            <div className="climate-data-summary">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Average Sea Surface Temperature (SST)</td>
                    <td>{formatTemperature(climateData.avg_sst)}</td>
                  </tr>
                  <tr>
                    <td>Average Sea Surface Salinity (SSS)</td>
                    <td>{formatValue(climateData.avg_sss)}</td>
                  </tr>
                  <tr>
                    <td>Number of Observations</td>
                    <td>{climateData.total_observations || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* OBIS Entries Table */}
      {clickedCoords && detectedRegion && (
        <div className="data-section">
          <h2>OBIS Entries in Region</h2>
          {loading ? (
            <p>Loading species data...</p>
          ) : obisEntries.length > 0 ? (
            <div className="obis-entries">
              <table>
                <thead>
                  <tr>
                    <th>Scientific Name</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Day of Year</th>
                    <th>SST</th>
                    <th>SSS</th>
                    <th>Depth</th>
                  </tr>
                </thead>
                <tbody>
                  {obisEntries.map(entry => (
                    <tr key={entry.id}>
                      <td>{entry.scientificName}</td>
                      <td>{formatValue(entry.latitude)}</td>
                      <td>{formatValue(entry.longitude)}</td>
                      <td>{formatDayOfYear(entry.dayOfYear)}</td>
                      <td>{formatTemperature(entry.sst)}</td>
                      <td>{formatValue(entry.sss)}</td>
                      <td>{entry.depth ? `${entry.depth}m` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {obisEntries.length >= 100 && (
                <p className="limit-note">Showing first 100 entries. Click a more specific area for more precise results.</p>
              )}
            </div>
          ) : (
            <p>No OBIS entries found for this region. Try clicking another area.</p>
          )}
        </div>
      )}
    </div>
  );
}