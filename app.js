
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const compression = require('compression');
const busboy = require('connect-busboy');
const cors = require('cors');

mongoose.Promise = global.Promise;
require('dotenv').config();

const config = require('./config');

// connection to database
const mongodbUri = `mongodb://${config.MONGO_HOST}`;
const mongooseOptions = { useNewUrlParser: true };
if (config.MONGO_USER && config.MONGO_PASSWORD) {
  mongooseOptions.auth = {};
  mongooseOptions.auth.user = config.MONGO_USER;
  mongooseOptions.auth.password = config.MONGO_PASSWORD;
}
mongoose.connect(mongodbUri, mongooseOptions);
const conn = mongoose.connection;
// eslint-disable-next-line no-console
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', () => {
  // eslint-disable-next-line no-console
  console.log('connected to database.');
});

// Create global app object
const app = express();
const thermometer = require('./server/routes/thermometer');

app.use(cors());
app.use(busboy({ highWaterMark: 2 * 1024 * 1024 }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression());
app.use(thermometer);

// / catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// finally, let's start our server...
const server = app.listen(process.env.PORT || 6700, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${server.address().port}`);
});
