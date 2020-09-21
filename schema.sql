DROP TABLE IF EXISTS location;

CREATE TABLE location (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255)
);

DROP TABLE IF EXISTS weather;
CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  time VARCHAR(30),
  forecast VARCHAR(255)
);
