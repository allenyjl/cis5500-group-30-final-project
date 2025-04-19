// server/routes/routes.js
const express = require('express');
const router = express.Router();
const { Pool, types } = require('pg');
const config = require('./config.json');
const { from } = require('form-data');

const connection = new Pool({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: config.rds_db,
    ssl: {
      rejectUnauthorized: false,
    },
  });
connection.connect((err) => err && console.log(err));

// Define a simple route
router.get('/', (req, res) => {
  res.send('Hello from the API!');
});

// Route handlers
// TEST ROUTE
const test = async (req, res) => {
  try {
    const result = await connection.query(`
      SELECT obis.id AS occurrenceid, obis."eventDate" AS eventdate
      FROM obis
      LIMIT 10;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getMostObservedSpecies = async (req, res) => {
  try {
    const result = await connection.query(`
      SELECT sn.scientificname,
             COUNT(*) AS obs_count
      FROM obis o
      JOIN scientific_names sn
        ON o.aphiaid = sn.aphiaid
      GROUP BY sn.scientificname
      ORDER BY obs_count DESC
      LIMIT 10;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getSpeciesByName = async (req, res) => {
  const { scientificName } = req.params;
  try {
    const result = await connection.query(
      'SELECT * FROM scientific_names WHERE scientificname = $1;',
      [scientificName]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const regionBounds = {
  northPacific: {
    minLat:   0.0,     // Equator
    maxLat:  58.2164,  // 58°13′ N
    minLon: -67.2500,  // 67°15′ W
    maxLon: 128.6931,  // 128°41′ E
  },
  southPacific: {
    minLat: -60.0,     // 60° S
    maxLat:   0.0,     // Equator
    minLon: -143.0610, // 143° 3′ W
    maxLon:  130.1113, // 130° 6′ E
  },
  northAtlantic: {
    minLat:   0.0,     // Equator
    maxLat:  66.5000,  // Arctic Circle (~66°30′ N)
    minLon: -80.0,     // 80° W
    maxLon:  20.0,     // 20° E
  },
  southAtlantic: {
    minLat: -60.0,     // 60° S
    maxLat:   0.0,     // Equator
    minLon: -70.0,     // 70° W
    maxLon:  20.0,     // 20° E
  },
  indianOcean: {
    minLat: -60.0,     // 60° S
    maxLat:  30.0,     // 30° N
    minLon:  20.0,     // 20° E
    maxLon: 120.0,     // 120° E
  },
  arcticOcean: {
    minLat:  66.5000,  // Arctic Circle
    maxLat:  90.0,     // North Pole
    minLon: -180.0,
    maxLon:  180.0,
  },
  southernOcean: {
    minLat: -90.0,     // South Pole
    maxLat: -60.0,     // 60° S
    minLon: -180.0,
    maxLon:  180.0,
  },
};

const getRegionTemperature = async (req, res) => {
  try {
    const result = await connection.query(`
      WITH region_boxes(region_id, min_lat, max_lat, min_lon, max_lon) AS (
        VALUES
          ('northPacific',  0.0,   58.2164,  -67.25, 128.6931),
          ('southPacific', -60.0,    0.0,    -143.061, 130.1113),
          ('northAtlantic', 0.0,    66.5,    -80.0,   20.0),
          ('southAtlantic',-60.0,    0.0,    -70.0,   20.0),
          ('indianOcean',  -60.0,   30.0,    20.0,   120.0),
          ('arcticOcean',   66.5,   90.0,   -180.0,  180.0),
          ('southernOcean', -90.0,  -60.0,  -180.0,  180.0)
      )
      SELECT
        rb.region_id,
        AVG(w.temperature) AS avg_temperature
      FROM wod w
      JOIN region_boxes rb
        ON w.latitude  BETWEEN rb.min_lat AND rb.max_lat
       AND w.longitude BETWEEN rb.min_lon AND rb.max_lon
      GROUP BY rb.region_id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getRegionSalinityAndPH = async (req, res) => {
  try {
    const result = await connection.query(`
      WITH region_boxes(region_id, min_lat, max_lat, min_lon, max_lon) AS (
        VALUES
          ('northPacific',  0.0,   58.2164,  -67.25, 128.6931),
          ('southPacific', -60.0,    0.0,    -143.061, 130.1113),
          ('northAtlantic', 0.0,    66.5,    -80.0,   20.0),
          ('southAtlantic',-60.0,    0.0,    -70.0,   20.0),
          ('indianOcean',  -60.0,   30.0,    20.0,   120.0),
          ('arcticOcean',   66.5,   90.0,   -180.0,  180.0),
          ('southernOcean', -90.0,  -60.0,  -180.0,  180.0)
      )
      SELECT
        rb.region_id,
        AVG(w.salinity) AS avg_salinity,
        AVG(w.ph)       AS avg_ph
      FROM wod w
      JOIN region_boxes rb
        ON w.latitude  BETWEEN rb.min_lat AND rb.max_lat
       AND w.longitude BETWEEN rb.min_lon AND rb.max_lon
      GROUP BY rb.region_id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getRegionSpecies = async (req, res) => {
  const { region } = req.params;
  try {
    let query = `
      WITH region_boxes(region_id, min_lat, max_lat, min_lon, max_lon) AS (
        VALUES
          ('northPacific',  0.0,   58.2164,  -67.25, 128.6931),
          ('southPacific', -60.0,    0.0,    -143.061, 130.1113),
          ('northAtlantic', 0.0,    66.5,    -80.0,   20.0),
          ('southAtlantic',-60.0,    0.0,    -70.0,   20.0),
          ('indianOcean',  -60.0,   30.0,    20.0,   120.0),
          ('arcticOcean',   66.5,   90.0,   -180.0,  180.0),
          ('southernOcean', -90.0,  -60.0,  -180.0,  180.0)
      )
      SELECT DISTINCT
        rb.region_id,
        sn.scientificname
      FROM obis o
      JOIN scientific_names sn
        ON o.aphiaid = sn.aphiaid
      JOIN region_boxes rb
        ON o.latitude  BETWEEN rb.min_lat AND rb.max_lat
       AND o.longitude BETWEEN rb.min_lon AND rb.max_lon
    `;
    
    // If a specific region is requested, filter by it
    if (region && region !== 'all') {
      query += ` WHERE rb.region_id = $1`;
      query += ` ORDER BY sn.scientificname`;
      const result = await connection.query(query, [region]);
      res.json(result.rows);
    } else {
      // Otherwise return all regions
      query += ` ORDER BY rb.region_id, sn.scientificname`;
      const result = await connection.query(query);
      res.json(result.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getRegions = async (req, res) => {
  try {
    // Return a list of all ocean regions
    const regions = Object.keys(regionBounds).map(region => ({
      id: region,
      name: region
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    }));
    res.json(regions);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

// Connect route handlers to router
router.get('/test', test);
router.get('/species/most-observed', getMostObservedSpecies);
router.get('/species/name/:scientificName', getSpeciesByName);
router.get('/regions', getRegions);
router.get('/regions/temperature', getRegionTemperature);
router.get('/regions/water-properties', getRegionSalinityAndPH);
router.get('/regions/species/:region', getRegionSpecies);
router.get('/regions/species', getRegionSpecies);

module.exports = {
  router,
  test,
  getMostObservedSpecies,
  getSpeciesByName,
  getRegionTemperature,
  getRegionSalinityAndPH,
  getRegionSpecies,
  getRegions,
};
