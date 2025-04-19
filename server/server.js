const express = require('express');
const cors = require('cors');
const config = require('./config.json');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// Mount the router for API endpoints
app.use('/', routes.router);

const PORT = config.server_port || 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

module.exports = app;