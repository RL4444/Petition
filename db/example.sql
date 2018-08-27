CREATE TABLE reference {
    id SERIAL PRIMARY KEY,
    foreign_key INTEGER REFERENCES othertable(tablecolumntoreference)
};

-- creates a link between another table known as a foreign key
-- the best way to create a link that makes the database more connected

SELECT table1.name AS (alias) table1_name (the actual name on the table), table2.name AS table2_name
FROM table1
JOIN table2
    ON table1.id = table2.table1_id;


creates a hard link between the tables id
