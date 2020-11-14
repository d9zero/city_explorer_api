'use strict';

require('dotenv').config();

// Application Dependencies

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const app = express();
const pg = require('pg');

// application setup

const PORT = process.env.PORT;

app.use(cors());

app.use(express.static('./public'));

// intialize client
console.log(PORT, process.env.DATABASE_URL);
const client = new pg.Client(process.env.DATABASE_URL);

// API Route Definitions

app.get('/restaurants', handleRestaurants);
app.get('/trails', handleTrails);
app.get ('/weather', handleWeather);
app.get('/yelp', yelpHandler);
app.get('/movies', movieHandler);
app.get('/location', handleLocation);

app.get('/', (req, res) => {
  res.send('The Home Page!');
});
app.use('*', notFoundHandler);

// client.on('error', err => console.error(err));



// HELPER FUNCTIONS

function handleLocation(req, res) {
  try {
    let geoData = require('./data/location.json');
    let city = req.query.city;
   
    const sql = `SELECT * FROM locations where search_query=$1;`;
    const safeValues = [city];
    const url = 'https://us1.locationiq.com/v1/search.php';
    client.query(sql, safeValues)
      .then(resultsFromSql => {
        if(resultsFromSql.rowCount){
          const chosenCity = resultsFromSql.rows[0];
          console.log('found the city in database');
          res.status(200).send(chosenCity);
        } 
      }).catch(err => res.send(err));

    // const locationData = new Location(city, geoData);
    // res.send(locationData);
   
    const queryObject = {
      key: process.env.GEOCODE_API_KEY,
      city,
      formation: 'JSON',
      limit: 2
    }
    superagent.get(url)
      .query(queryObject)
      .then(data => {
        console.log(data.body[0]);
        const place = new Location(city, data);
        const sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4;';
        const safeValues = [city, place.formatted_query, place.latitude, place.longitude];

        client.query(sql, safeValues)
          .then(resultsFromSql => {
            const chosenCity = resultsFromSql.rows[0];
          
          })
        res.status(200).send(place);
      })
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
  const SQLDATE = `SELECT COUNT(1) FROM EVENTS WHERE TIME > NOW() - INTERVAL '1 day';`;
  const SQLVAL = `SELECT * FROM weather WHERE search_query=$1;`;

  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&country=us&days=8&key=${key}`;

  let safeValues = [city]
  client.query(SQLVAL, safeValues)
    .then(result => {
      if (results.rows.length > 0) { 
        console.log('getting city from memory', results.query.city);
        res.status(200).json(result.rows[0]);
    }
     
    else {
      
    


      superagent.get(url)
        .then(data => {
          console.log(data.body.data);
          const weatherArr = data.body.data
          const weatherConst = weatherArr.map(entry => new Weather(entry));
          response.send(weatherConst);
        })
        .catch(() => response.status(500).send('So sorry, something went wrong.'));
    }
  })
}

// Trail Function

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

// Yelp function

function yelpHandler(request, response){
  let city = request.query.search_query;
  let url = 'https://api.yelp.com/v3/businesses/search';
  const queryParams = {
  location: city,
  term: 'food',
  limit: 5
  }
    superagent.get(url)
  .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
  .query(queryParams)
  .then(data => {
    let foodData = data.body.businesses;
    let allRestuarants = foodData.map(food => new Restaurant(food));
    response.status(200).send(allRestuarants);
  }).catch(error => errorAlert(error, response));
}

// Movie Function

function movieHandler(req, res) {

  let city = req.query.search_query;
  let tok4 = process.env.MOVIE_API_KEY;
  const url = `https://api.themoviedb.org/3/search/movie/?api_key=${tok4}&query=${city}`;

  const queryParams = {
    access_token: process.env.MOVIE_API_KEY,
    types: 'poi',
    limit: 10,
  };

  superagent.get(url)
    .query(queryParams)
    .then((results) => {
      let searchMovie = results.body.results.map(movies => {
        let newerMovies = new Place(movies)
        return newerMovies;
      })
      res.status(200).send(searchMovie);
    })
    .catch((error) => {
      console.log('ERROR', error);
      res.status(500).send('So sorry, something went wrong.');
    });

}


//  Constructors


function Location(city, locationData) {
  this.search_query = city;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
  this.formatted_query = locationData.display_name;
}

function Restaurant(obj) {
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}

function Place(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popluarity;
  this.released_on = obj.release_date;
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
   app.listen(PORT, () => {
     console.log(`App is listening on ${PORT}`)
    });
 }

client.connect()
 .then(startServer)
 .catch(e => console.log(e));


