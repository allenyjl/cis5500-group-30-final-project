const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));
app.get('/test', routes.test);

const PORT = config.server_port || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://${config.server_host}:${PORT}/`);
});

module.exports = app;