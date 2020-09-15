'use strict';

require('dotenv').config();
const express = require('express');
const cors = express();
const geoData = require('./data/location.json');
const restData = require('./data/weather.json');

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Home Page!');
});

app.get('/bad', (req, res) => {
  throw new Error('poo');
});

// The callback can be a separate function. Really makes things readable
app.get('/about', aboutUsHandler);

function aboutUsHandler(req, res) {
  res.status(200).send('About Us Page');
}

// API Routes
app.get('/location', handleLocation);
app.get('/restaurants', handleRestaurants);

app.use('*', notFoundHandler);

// HELPER FUNCTIONS

function handleLocation(req, res) {
  try {
    const geoData = require('./data/location.json');
    const city = req.query.city;
    const locationData = new Location(city, geoData);
    res.send(locationData);
  }
  catch (error) {
    console.log('ERROR', error);
    res.status(500).send('So sorry, something went wrong.');
  }
}

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function handleRestaurants(req, res) {
  try {
    const data = require('./data/restaurants.json');
    const restaurantData = [];
    data.nearby_restaurants.forEach(entry => {
      restaurantData.push(new Restaurant(entry));
    });
    res.send(restaurantData);
  }
  catch (error) {
    console.log('ERROR', error);
    res.status(500).send('So sorry, something went wrong.');
  }
}

function Restaurant(entry) {
  this.restaurant = entry.restaurant.name;
  this.cuisines = entry.restaurant.cuisines;
  this.locality = entry.restaurant.location.locality;
}

function notFoundHandler(req, res) {
  res.status(404).send('huh?');
}



// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));