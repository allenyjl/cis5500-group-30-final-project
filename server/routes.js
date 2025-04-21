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
      SELECT sn."scientificName",
             COUNT(*) AS obs_count
      FROM obis o
      JOIN scientific_names sn
        ON o.aphiaid = sn.aphiaid
      GROUP BY sn."scientificName"
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
      `
      WITH region_boxes(region_id, min_lat, max_lat, min_lon, max_lon) AS (
        VALUES
          ('northPacific_west',    0.0,   66.5,    120.0,   180.0),
          ('northPacific_east',    0.0,   66.5,   -180.0,  -120.0),
          ('southPacific_west',  -60.0,    0.0,    120.0,   180.0),
          ('southPacific_east',  -60.0,    0.0,   -180.0,   -70.0),
          ('northAtlantic',        0.0,   66.5,    -70.0,    20.0),
          ('southAtlantic',      -60.0,    0.0,    -70.0,    20.0),
          ('indianOcean',        -60.0,   30.0,     20.0,   146.5),
          ('arcticOcean',         66.5,   90.0,   -180.0,   180.0),
          ('southernOcean',      -90.0,  -60.0,   -180.0,   180.0)
      ),
      observations AS (
        SELECT
          sn."scientificName",
          o."eventDate",
          o."decimalLongitude" AS longitude,
          o."decimalLatitude" AS latitude
        FROM scientific_names sn
        JOIN obis o ON o.aphiaid = sn.aphiaid
        WHERE sn."scientificName" = $1
      ),
      observations_with_region AS (
        SELECT 
          o.*,
          (SELECT rb.region_id 
           FROM region_boxes rb 
           WHERE o.latitude BETWEEN rb.min_lat AND rb.max_lat 
             AND o.longitude BETWEEN rb.min_lon AND rb.max_lon
           LIMIT 1) AS region_id
        FROM observations o
      )
      SELECT * FROM observations_with_region
      WHERE region_id IS NOT NULL
      ORDER BY "eventDate" DESC
      LIMIT 100;
      `,
      [scientificName]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

// Updated regionBounds with corrected boundaries
const regionBounds = {
  northPacific_west: {
    minLat: 0.0,      // Equator
    maxLat: 66.5,     // Arctic Circle
    minLon: 120.0,    // 120° E
    maxLon: 180.0,    // 180°
  },
  northPacific_east: {
    minLat: 0.0,      // Equator
    maxLat: 66.5,     // Arctic Circle
    minLon: -180.0,   // -180°
    maxLon: -120.0,   // 120° W
  },
  southPacific_west: {
    minLat: -60.0,    // 60° S
    maxLat: 0.0,      // Equator
    minLon: 120.0,    // 120° E
    maxLon: 180.0,    // 180°
  },
  southPacific_east: {
    minLat: -60.0,    // 60° S
    maxLat: 0.0,      // Equator
    minLon: -180.0,   // -180°
    maxLon: -70.0,    // 70° W
  },
  northAtlantic: {
    minLat: 0.0,      // Equator
    maxLat: 66.5,     // Arctic Circle
    minLon: -70.0,    // 70° W
    maxLon: 20.0,     // 20° E
  },
  southAtlantic: {
    minLat: -60.0,    // 60° S
    maxLat: 0.0,      // Equator
    minLon: -70.0,    // 70° W
    maxLon: 20.0,     // 20° E
  },
  indianOcean: {
    minLat: -60.0,    // 60° S
    maxLat: 30.0,     // 30° N
    minLon: 20.0,     // 20° E
    maxLon: 146.5,    // 146.5° E
  },
  arcticOcean: {
    minLat: 66.5,     // Arctic Circle
    maxLat: 90.0,     // North Pole
    minLon: -180.0,   // -180°
    maxLon: 180.0,    // 180°
  },
  southernOcean: {
    minLat: -90.0,    // South Pole
    maxLat: -60.0,    // 60° S
    minLon: -180.0,   // -180°
    maxLon: 180.0,    // 180°
  },
};


const getRegionTemperature = async (req, res) => {
  try {
    const result = await connection.query(`
      WITH region_boxes(region_id, min_lat, max_lat, min_lon, max_lon) AS (
        VALUES
          ('northPacific_west',    0.0,   66.5,    120.0,   180.0),
          ('northPacific_east',    0.0,   66.5,   -180.0,  -120.0),
          ('southPacific_west',  -60.0,    0.0,    120.0,   180.0),
          ('southPacific_east',  -60.0,    0.0,   -180.0,   -70.0),
          ('northAtlantic',        0.0,   66.5,    -70.0,    20.0),
          ('southAtlantic',      -60.0,    0.0,    -70.0,    20.0),
          ('indianOcean',        -60.0,   30.0,     20.0,   146.5),
          ('arcticOcean',         66.5,   90.0,   -180.0,   180.0),
          ('southernOcean',      -90.0,  -60.0,   -180.0,   180.0)
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
          ('northPacific_west',    0.0,   66.5,    120.0,   180.0),
          ('northPacific_east',    0.0,   66.5,   -180.0,  -120.0),
          ('southPacific_west',  -60.0,    0.0,    120.0,   180.0),
          ('southPacific_east',  -60.0,    0.0,   -180.0,   -70.0),
          ('northAtlantic',        0.0,   66.5,    -70.0,    20.0),
          ('southAtlantic',      -60.0,    0.0,    -70.0,    20.0),
          ('indianOcean',        -60.0,   30.0,     20.0,   146.5),
          ('arcticOcean',         66.5,   90.0,   -180.0,   180.0),
          ('southernOcean',      -90.0,  -60.0,   -180.0,   180.0)
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
          ('northPacific_west',    0.0,   66.5,    120.0,   180.0),
          ('northPacific_east',    0.0,   66.5,   -180.0,  -120.0),
          ('southPacific_west',  -60.0,    0.0,    120.0,   180.0),
          ('southPacific_east',  -60.0,    0.0,   -180.0,   -70.0),
          ('northAtlantic',        0.0,   66.5,    -70.0,    20.0),
          ('southAtlantic',      -60.0,    0.0,    -70.0,    20.0),
          ('indianOcean',        -60.0,   30.0,     20.0,   146.5),
          ('arcticOcean',         66.5,   90.0,   -180.0,   180.0),
          ('southernOcean',      -90.0,  -60.0,   -180.0,   180.0)
      )
      SELECT DISTINCT
        rb.region_id,
        sn."scientificName"
      FROM obis o
      JOIN scientific_names sn
        ON o.aphiaid = sn.aphiaid
      JOIN region_boxes rb
        ON o."decimalLatitude"  BETWEEN rb.min_lat AND rb.max_lat
       AND o."decimalLongitude" BETWEEN rb.min_lon AND rb.max_lon
       
    `;

    // If a specific region is requested, filter by it
    if (region && region !== 'all') {
      query += ` WHERE rb.region_id = $1`;
      query += ` ORDER BY sn."scientificName"`;
      const result = await connection.query(query, [region]);
      res.json(result.rows);
    } else {
      // Otherwise return all regions
      query += ` ORDER BY rb.region_id, sn."scientificName"`;
      const result = await connection.query(query);
      res.json(result.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

// Update getRegions to handle the split Pacific regions
const getRegions = async (req, res) => {
  try {
    // Return a list of all ocean regions with some special handling for split regions
    const regions = Object.keys(regionBounds).map(region => {
      // For the split Pacific regions, we'll provide a cleaner name for the UI
      if (region === 'northPacific_west' || region === 'northPacific_east') {
        return {
          id: region,
          name: 'North Pacific'
        };
      } else if (region === 'southPacific_west' || region === 'southPacific_east') {
        return {
          id: region,
          name: 'South Pacific'
        };
      } else {
        return {
          id: region,
          name: region
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        };
      }
    });
    
    // Filter to remove duplicates (since we have east/west regions with same display name)
    const uniqueRegions = regions.filter((region, index, self) => 
      index === self.findIndex((r) => r.name === region.name)
    );
    
    res.json(uniqueRegions);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getSpeciesMonthlyTrends = async (req, res) => {
  const { scientificName } = req.params;
  try {
    const result = await connection.query(
      `
      WITH monthly_counts AS (
        SELECT
          EXTRACT(MONTH FROM (o."eventDate"::date))::INT AS month,
          COUNT(*)                                    AS occ_count
        FROM obis o
        JOIN scientific_names sn
          ON o.aphiaid = sn.aphiaid
        WHERE sn."scientificName" = $1
          AND EXTRACT(YEAR FROM (o."eventDate"::date))::INT = 2023
        GROUP BY month
      ),
      monthly_wod AS (
        SELECT
          w.month,
          AVG(w.temperature) AS avg_wod_temp
        FROM wod w
        WHERE w.year = 2023
        GROUP BY w.month
      )
      SELECT
        mc.month,
        mc.occ_count,
        prev.occ_count      AS prev_count,
        CASE
          WHEN prev.occ_count = 0 THEN NULL
          ELSE 100.0 * (mc.occ_count - prev.occ_count) / prev.occ_count
        END                  AS pct_change,
        mw.avg_wod_temp
      FROM monthly_counts mc
      LEFT JOIN monthly_counts prev
        ON prev.month = mc.month - 1
      LEFT JOIN monthly_wod mw
        ON mw.month   = mc.month
      ORDER BY mc.month;
      `,
      [scientificName]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

router.get('/test', test);
router.get('/species/most-observed', getMostObservedSpecies);
router.get('/species/name/:scientificName', getSpeciesByName);
router.get('/species/monthly-trends/:scientificName', getSpeciesMonthlyTrends);
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
  getSpeciesMonthlyTrends,
  getRegionTemperature,
  getRegionSalinityAndPH,
  getRegionSpecies,
  getRegions,
};