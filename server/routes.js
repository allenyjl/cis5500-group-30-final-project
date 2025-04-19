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

// Route: GET /test
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

module.exports = {
  test,
  getMostObservedSpecies,
  getSpeciesByName,
};
