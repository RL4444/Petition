DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (

    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    signature TEXT NOT NULL
);
