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



// SPECIES PAGE ROUTES
const getSpeciesInfoById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await connection.query(/* full SQL I gave earlier */);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const getSpeciesShifts = async (req, res) => {
  const { minCount, oldStart, oldEnd, newStart, newEnd } = req.query;
  try {
    const result = await connection.query(/* full SQL I gave earlier */);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

const searchSpecies = async (req, res) => {
  console.log('--- /search_species called ---');
console.log('query params:', req.query);
  const {
    scientificName,
    marine,
    brackish,
    regions,
    minSightings,
    maxSightings,
    minDepth,
    maxDepth,
    minTemperature,
    maxTemperature,
  } = req.query;

  let query = `
    SELECT sn.aphiaid AS id, sn."scientificName"
    FROM scientific_names sn
    JOIN obis o ON sn.aphiaid = o.aphiaid
  `;
  let where = [];
  let params = [];
  let idx = 1;

  if (scientificName) {
    where.push(`sn."scientificName" ILIKE $${idx++}`);
    params.push(`%${scientificName}%`);
  }

  if (marine === 'true') {
    where.push(`o.marine = $${idx++}`);
    params.push(true);
  }
  if (brackish === 'true') {
    where.push(`o.brackish = $${idx++}`);
    params.push(true);
  }

  if (minDepth) {
    where.push(`o.depth >= $${idx++}`);
    params.push(Number(minDepth));
  }

  if (maxDepth) {
    where.push(`o.depth <= $${idx++}`);
    params.push(Number(maxDepth));
  }

  if (minTemperature) {
    where.push(`o.temperature >= $${idx++}`);
    params.push(Number(minTemperature));
  }

  if (maxTemperature) {
    where.push(`o.temperature <= $${idx++}`);
    params.push(Number(maxTemperature));
  }

  if (regions) {
    const regionList = regions.split(',');
    where.push(`o.region_id = ANY($${idx++})`);
    params.push(regionList);
  }

  if (minSightings || maxSightings) {
    query = `
      SELECT id, "scientificName" FROM (
        SELECT sn.aphiaid AS id, sn."scientificName", COUNT(*) AS sightings
        FROM scientific_names sn
        JOIN obis o ON sn.aphiaid = o.aphiaid
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        GROUP BY sn.aphiaid, sn."scientificName"
      ) sub
      WHERE 1=1
    `;
    if (minSightings) {
      query += ` AND sightings >= $${idx++}`;
      params.push(Number(minSightings));
    }
    if (maxSightings) {
      query += ` AND sightings <= $${idx++}`;
      params.push(Number(maxSightings));
    }
  } else if (where.length) {
    query += ' WHERE ' + where.join(' AND ');
  }

  query += ' GROUP BY sn.aphiaid, sn."scientificName" LIMIT 100';

  try {
    console.log('Final SQL:', query);
console.log('Final params:', params);
    const result = await connection.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in search_species:', err);
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
          o.id,
          sn."scientificName",
          o."eventDate",
          o."decimalLongitude" AS longitude,
          o."decimalLatitude" AS latitude
        FROM scientific_names sn
        JOIN obis o ON o.aphiaid = sn.aphiaid
        WHERE sn."scientificName" ILIKE $1
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
      [`%${scientificName}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};


const regionBounds = {
  // Arctic Circle @ 66.5° N
  // Equator @ 0° N
  // South Pole @ -90° S
  // North Pole @ 90° N
  // negative coords are for West and South
  // positive coords are for East and North

  northPacific_west: {
    minLat: 0.0,
    maxLat: 66.5,
    minLon: 120.0,
    maxLon: 180.0,
  },
  northPacific_east: {
    minLat: 0.0,
    maxLat: 66.5,
    minLon: -180.0,
    maxLon: -120.0,
  },
  southPacific_west: {
    minLat: -60.0,
    maxLat: 0.0,
    minLon: 120.0,
    maxLon: 180.0,
  },
  southPacific_east: {
    minLat: -60.0,
    maxLat: 0.0,
    minLon: -180.0,
    maxLon: -70.0,
  },
  northAtlantic: {
    minLat: 0.0,
    maxLat: 66.5,
    minLon: -70.0,
    maxLon: 20.0,
  },
  southAtlantic: {
    minLat: -60.0,    
    maxLat: 0.0,      
    minLon: -70.0,   
    maxLon: 20.0,    
  },
  indianOcean: {
    minLat: -60.0,
    maxLat: 30.0,
    minLon: 20.0,
    maxLon: 146.5,
  },
  arcticOcean: {
    minLat: 66.5,
    maxLat: 90.0,
    minLon: -180.0,
    maxLon: 180.0,
  },
  southernOcean: {
    minLat: -90.0,
    maxLat: -60.0,
    minLon: -180.0,
    maxLon: 180.0,
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
            .replace(/([A-Z])/g, ' $1') 
            .replace(/^./, str => str.toUpperCase()) 
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




// Currently fecthces all species depending on name serached (limited 10 for now but can do lazy pagination later)
const getAllSpecies = async (req, res) => {
  const name = req.query.scientificName ?? '';

  connection.query(`
    SELECT sn.aphiaid AS id, sn."scientificName"
    FROM scientific_names sn
    JOIN obis o ON sn.aphiaid = o.aphiaid
    WHERE sn."scientificName" ILIKE $1
    GROUP BY sn.aphiaid, sn."scientificName"
    LIMIT 10
  `, [`%${name}%`], (err, data) => {
    if (err) {
      console.log('Error:', err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
};








// INTERACTIVE MAP PAGE ROUTE w/ 2 Queries:

const getObisByCoordinates = async (req, res) => {
  const { lat, lng } = req.params;
  
  try {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    
    const normLng = parsedLng < -180 ? parsedLng + 360 : 
                   parsedLng > 180 ? parsedLng - 360 : parsedLng;
    
    let selectedRegion = null;
    
    for (const [regionKey, region] of Object.entries(regionBounds)) {
      if (parsedLat >= region.minLat && 
          parsedLat <= region.maxLat && 
          normLng >= region.minLon && 
          normLng <= region.maxLon) {
        selectedRegion = {
          id: regionKey,
          name: regionKey
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase()),
          bounds: region
        };
        break;
      }
    }
    
    if (!selectedRegion) {
      return res.status(404).json({ message: "No ocean region found for these coordinates" });
    }
    
    const obisQuery = `
      WITH region_data AS (
        SELECT 
          $1::text AS region_id,
          $2::float AS min_lat,
          $3::float AS max_lat, 
          $4::float AS min_lon,
          $5::float AS max_lon
      )
      SELECT 
        o.id,
        sn."scientificName",
        o."decimalLatitude" AS latitude,
        o."decimalLongitude" AS longitude,
        o."dayOfYear",
        o.sst,
        o.sss,
        o.depth
      FROM obis o
      JOIN scientific_names sn ON o.aphiaid = sn.aphiaid
      JOIN region_data rd ON 
        o."decimalLatitude" BETWEEN rd.min_lat AND rd.max_lat AND
        o."decimalLongitude" BETWEEN rd.min_lon AND rd.max_lon
      LIMIT 100;
    `;
    
    const climateQuery = `
      WITH region_data AS (
        SELECT 
          $1::text AS region_id,
          $2::float AS min_lat,
          $3::float AS max_lat, 
          $4::float AS min_lon,
          $5::float AS max_lon
      )
      SELECT 
        AVG(o.sst) AS avg_sst,
        AVG(o.sss) AS avg_sss,
        COUNT(*) AS total_observations
      FROM obis o
      JOIN region_data rd ON 
        o."decimalLatitude" BETWEEN rd.min_lat AND rd.max_lat AND
        o."decimalLongitude" BETWEEN rd.min_lon AND rd.max_lon
      WHERE o.sst IS NOT NULL OR o.sss IS NOT NULL;
    `;
    
    const [obisResult, climateResult] = await Promise.all([
      connection.query(obisQuery, [
        selectedRegion.id,
        selectedRegion.bounds.minLat,
        selectedRegion.bounds.maxLat,
        selectedRegion.bounds.minLon,
        selectedRegion.bounds.maxLon
      ]),
      connection.query(climateQuery, [
        selectedRegion.id,
        selectedRegion.bounds.minLat,
        selectedRegion.bounds.maxLat,
        selectedRegion.bounds.minLon,
        selectedRegion.bounds.maxLon
      ])
    ]);
    
    res.json({
      region: selectedRegion,
      obisEntries: obisResult.rows,
      climate: climateResult.rows[0]
    });
  } catch (err) {
    console.error('Error getting OBIS data by coordinates:', err);
    res.status(500).json({ error: 'Server error fetching data' });
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
router.get('/obis/coordinates/:lat/:lng', getObisByCoordinates);

router.get('/search_species', searchSpecies);
router.get('/species/:id', getSpeciesInfoById);
router.get('/species/shifts', getSpeciesShifts);

router.get('/species/search', getAllSpecies);

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
  getObisByCoordinates,
  getAllSpecies,
  getSpeciesInfoById,
  getSpeciesShifts,
  searchSpecies
};