DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS users_profiles;


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(100) NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE users_profiles (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(100),
    homepage VARCHAR(100),
    users_id INTEGER UNIQUE NOT NULL
);
