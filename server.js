'use strict';
require('dotenv').config();
const express = require('express');
const cors = express();
const geoData = require('./data/location.json');
const restData = require('./data/weather.json');



