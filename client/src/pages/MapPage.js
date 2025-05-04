import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
// Import Leaflet directly from CDN instead of the package
// The CSS is already included in the index.html

const API_URL = 'http://localhost:8080';

// Ocean region bounds definitions
const regionBounds = {
  northPacific_west: {
    id: 'northPacific_west',
    name: 'North Pacific (West)',
    minLat: 0.0,      // Equator
    maxLat: 66.5,     // Arctic Circle
    minLon: 120.0,    // 120° E
    maxLon: 180.0,    // 180°
  },
  northPacific_east: {
    id: 'northPacific_east',
    name: 'North Pacific (East)',
    minLat: 0.0,      // Equator
    maxLat: 66.5,     // Arctic Circle
    minLon: -180.0,   // -180°
    maxLon: -120.0,   // 120° W
  },
  southPacific_west: {
    id: 'southPacific_west',
    name: 'South Pacific (West)',
    minLat: -60.0,    // 60° S
    maxLat: 0.0,      // Equator
    minLon: 120.0,    // 120° E
    maxLon: 180.0,    // 180°
  },
  southPacific_east: {
    id: 'southPacific_east',
    name: 'South Pacific (East)',
    minLat: -60.0,    // 60° S
    maxLat: 0.0,      // Equator
    minLon: -180.0,   // -180°
    maxLon: -70.0,    // 70° W
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
    minLat: -60.0,    // 60° S
    maxLat: 0.0,      // Equator
    minLon: -70.0,    // 70° W
    maxLon: 20.0,     // 20° E
  },
  indianOcean: {
    id: 'indianOcean',
    name: 'Indian Ocean',
    minLat: -60.0,    // 60° S
    maxLat: 30.0,     // 30° N
    minLon: 20.0,     // 20° E
    maxLon: 146.5,    // 146.5° E
  },
  arcticOcean: {
    id: 'arcticOcean',
    name: 'Arctic Ocean',
    minLat: 66.5,     // Arctic Circle
    maxLat: 90.0,     // North Pole
    minLon: -180.0,   // -180°
    maxLon: 180.0,    // 180°
  },
  southernOcean: {
    id: 'southernOcean',
    name: 'Southern Ocean',
    minLat: -90.0,    // South Pole
    maxLat: -60.0,    // 60° S
    minLon: -180.0,   // -180°
    maxLon: 180.0,    // 180°
  },
};

export default function MapPage() {
  // eslint-disable-next-line no-unused-vars
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [temperatureData, setTemperatureData] = useState([]);
  const [waterPropertiesData, setWaterPropertiesData] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // New state for clicked coordinates
  const [clickedCoords, setClickedCoords] = useState(null);
  // New state for detected region
  const [detectedRegion, setDetectedRegion] = useState(null);
  
  // Reference to map container
  const mapContainerRef = useRef(null);
  // Store the map instance in a ref to ensure it persists between renders
  const mapInstanceRef = useRef(null);

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

  // Function to determine which ocean region contains the given coordinates
  const detectOceanRegion = (lat, lng) => {
    // Handle longitude wraparound for coordinates
    const normLng = lng < -180 ? lng + 360 : lng > 180 ? lng - 360 : lng;
    
    // eslint-disable-next-line no-unused-vars
    for (const [regionKey, region] of Object.entries(regionBounds)) {
      if (
        lat >= region.minLat && 
        lat <= region.maxLat && 
        normLng >= region.minLon && 
        normLng <= region.maxLon
      ) {
        return region;
      }
    }
    return null; // No matching region found
  };

  const formatTemperature = (temp) => {
    return temp ? `${parseFloat(temp).toFixed(2)} °C` : 'N/A';
  };

  const formatValue = (value) => {
    return value ? parseFloat(value).toFixed(2) : 'N/A';
  };

  // Initialize the map
  useEffect(() => {
    // Set explicit dimensions for the map container - do this first, regardless of map initialization
    if (mapContainerRef.current) {
      mapContainerRef.current.style.height = '500px';
      mapContainerRef.current.style.width = '100%';
      mapContainerRef.current.style.display = 'block';
    }
    
    // Skip if map is already initialized
    if (mapInstanceRef.current) return;
    
    // Make sure the Leaflet CSS is loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCSS.crossOrigin = '';
      document.head.appendChild(leafletCSS);
    }
    
    // Function to initialize the map
    function initializeMap() {
      // Double check map container exists and Leaflet is loaded
      if (!mapContainerRef.current || !window.L) return;
      
      try {
        console.log("Initializing map...");
        // Create the map
        const L = window.L;
        
        // Remove any existing map instance first
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        
        // Create a new map instance
        const map = L.map(mapContainerRef.current, {
          center: [20, 0],
          zoom: 2,
          minZoom: 1
        });
        
        mapInstanceRef.current = map;
        
        // Add the OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add the click event handler
        map.on('click', function(e) {
          const { lat, lng } = e.latlng;
          setClickedCoords(e.latlng);
          
          // Detect which ocean region was clicked
          const region = detectOceanRegion(lat, lng);
          setDetectedRegion(region);
          
          // If a region was detected, update the selected region
          if (region) {
            setSelectedRegion(region.id);
          }
        });
        
        // Force map to recalculate its size
        setTimeout(() => {
          map.invalidateSize(true);
        }, 500);
        
        console.log("Map initialized successfully");
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to load map. Please try refreshing the page.');
      }
    }
    
    // Load Leaflet if not already loaded
    if (window.L) {
      console.log("Leaflet already loaded, initializing map");
      // Small delay to ensure DOM is fully ready
      setTimeout(initializeMap, 100);
    } else {
      console.log("Loading Leaflet script");
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      // Set script to load synchronously for reliable loading
      script.async = false;
      script.onload = () => {
        console.log("Leaflet script loaded");
        // Add a small delay to ensure script is fully initialized
        setTimeout(initializeMap, 100);
      };
      script.onerror = () => {
        console.error("Failed to load Leaflet script");
        setError('Failed to load map library. Please check your internet connection and try again.');
      };
      document.body.appendChild(script);
    }
    
    return () => {
      // Clean up map instance when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add this effect after the rest of your useEffects
  // This effect ensures the map renders correctly after component mounts
  useEffect(() => {
    // Force map to invalidate size after 1 second
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        console.log('Forcing map resize...');
        mapInstanceRef.current.invalidateSize(true);
      }
    }, 1000);

    // Clean up timer
    return () => clearTimeout(resizeTimer);
  }, [loading]); // Re-run when loading state changes

  if (loading) return <div>Loading regions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="map-page">
      <h1>Ocean Regions Data</h1>
      
      <div className="map-section" style={{ marginBottom: '30px' }}>
        <h2>Interactive World Map</h2>
        <p>Click on a region on the map to see its data</p>
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
              backgroundColor: '#f0f0f0', /* Background color to see container even if map doesn't load */
              overflow: 'hidden' /* Ensure contents don't overflow */
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
                ) : (
                  <p>No ocean region detected at this location</p>
                )}
              </div>
            )}
            {!clickedCoords && (
              <div className="instructions">
                <h3>Instructions</h3>
                <p>Click anywhere on the map to select an ocean region and view its data.</p>
              </div>
            )}
          </div>
        </div>
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
    </div>
  );
}