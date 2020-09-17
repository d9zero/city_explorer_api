'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// application setup

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.use(express.static('./public'));

// serer listener
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));

// api routes
app.get('/location', handleLocation);
app.get('/restaurants', handleRestaurants);
app.get('/trails', handleTrails);
app.get ('/weather', handleWeather);

const pg = require('pg');

app.get('/', (req, res) => {
  res.send('The Home Page!');
});

app.use('*', errorHandler)

// intialize client
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));



app.use('*', notFoundHandler);

// HELPER FUNCTIONS

function handleLocation(req, res) {
  try {
    let geoData = require('./data/location.json');
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

function handleWeather(request, response) {
  let key = process.env.WEATHER_API_KEY;
  let city = request.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&country=us&days=8&key=${key}`;


  superagent.get(url)
    .then(data => {
      console.log(data.body.data);
      const weatherArr = data.body.data
      const weatherConst = weatherArr.map(entry => new Weather(entry));
      response.send(weatherConst);
    })
    .catch(() => response.status(500).send('So sorry, something went wrong.'));
}


function handleTrails(request, response){
  let lat = request.query.latitude;
  let lon = request.query.longitude;
  let key = process.env.HIKING_API_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(hike => {
      const hikingData = hike.body.trails;
      const trailData = hikingData.map(active => new Hiking(active));
      response.send(trailData);
    })
    .catch(() => response.status(500).send('So sorry, something went wrong.'));
}

function notFoundHandler(req, res) {
  res.status(404).send('huh?');
}

function Weather(entry) {
  this.forecast = entry.weather.description;
  this.time = entry.valid_date;
}

function Hiking(active) {
  this.name = active.name
  this.location = active.location
  this.length = active.length
  this.stars = active.stars
  this.star_votes = active.starVotes
  this.summary = active.summary
  this.trail_url = active.url
  this.conditions = active.conditionDetails
  this.condition_date = active.conditionDate.slice(0,9);
  this.condition_time = active.conditionDate.slice(11,19);
}

// Make sure the server is listening for requests

 function startServer() {
   app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
 }

client.connect()
 .then(startServer)
 .catch(e => console.log(e));


