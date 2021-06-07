drop table if exists volunteer, host, sign_in, Service, admin, admin_sign_in, feedback CASCADE;

CREATE TABLE IF NOT EXISTS volunteer (
  id SERIAL PRIMARY KEY UNIQUE,
  user_name VARCHAR (50) NOT NULL UNIQUE,
  first_name VARCHAR (50) NOT NULL,
  last_name VARCHAR (50) NOT NULL,
  password VARCHAR (255) NOT NULL,
  description text,
  email VARCHAR (255) NOT NULL UNIQUE,
  country VARCHAR (50) NOT NULL,
  birth_date DATE,
  Gender text,
  skills text,
  rating int,
  rating_count int,
  profile_image text,
  token text
);
CREATE TABLE IF NOT EXISTS host (
  id SERIAL PRIMARY KEY UNIQUE,
  user_name VARCHAR (50) NOT NULL UNIQUE,
  first_name VARCHAR (50) NOT NULL,
  last_name VARCHAR (50) NOT NULL,
  password VARCHAR (255) NOT NULL,
  description text,
  email VARCHAR (255) NOT NULL UNIQUE,
  country VARCHAR (50) NOT NULL,
  birth_date DATE,
  category VARCHAR (50),
  address VARCHAR (50) NOT NULL,
  Gender text,
  rating int,
  rating_count int,
  profile_image text,
  token text
);

CREATE TABLE IF NOT EXISTS sign_in (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR (50) NOT NULL UNIQUE,
  Password VARCHAR (255) NOT NULL
);
CREATE TABLE IF NOT EXISTS Service (
  id SERIAL PRIMARY KEY,
  title VARCHAR (50) NOT NULL,
  description text NOT NULL,
  country VARCHAR (50) NOT NULL,
  type VARCHAR (50) NOT NULL,
  details VARCHAR (255) NOT NULL,
  duration VARCHAR (50),
  from_date DATE,
  to_date DATE,
  working_hours VARCHAR (50),
  working_days VARCHAR (50),
  address VARCHAR (255),
  extra text,
  profile_image text,
  likes int,
  host_id INT ,
  FOREIGN KEY (host_id) REFERENCES host (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR (50) NOT NULL UNIQUE ,
  first_name VARCHAR (50) NOT NULL,
  last_name VARCHAR (50) NOT NULL,
  Password VARCHAR (255) NOT NULL,
  email VARCHAR (255) NOT NULL UNIQUE,
  token text
);
CREATE TABLE IF NOT EXISTS admin_sign_in (
  id SERIAL PRIMARY KEY,
  email VARCHAR (255) NOT NULL,
  confirmation_code VARCHAR (50) NOT NULL,
  Password VARCHAR (255) NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  description text
);
