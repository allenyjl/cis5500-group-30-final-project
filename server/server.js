const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));
app.get('/test', routes.test);


app.get('/species/most-observed', routes.getMostObservedSpecies);
app.get('/species/name/:scientificName', routes.getSpeciesByName);

const PORT = config.server_port || 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

module.exports = app;