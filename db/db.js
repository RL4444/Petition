const spicedPg = require("spiced-pg");

var dbUrl =
    process.env.DATABASE_URL ||
    "postgres://spicedling:password@localhost:5432/petition";

var db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg("postgres:lewis:postgres@localhost:5432/petition");
}

exports.insertSig = function(userid, firstname, lastname, signature) {
    const q = `
        INSERT INTO signatures(user_id, first_name, last_name, signature)
            VALUES($1, $2, $3, $4)
            RETURNING *
    `;
    const params = [userid, firstname, lastname, signature];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};

exports.createUser = function(firstName, lastName, email, hashedpassword) {
    const q = `
        INSERT INTO users(first_name, last_name, email, hashed_password)
            VALUES($1, $2, $3, $4)
            RETURNING *
    `;
    const params = [firstName, lastName, email, hashedpassword];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};
exports.addInfo = function(age, city, homepage, usersid) {
    const q = `
        INSERT INTO users_profiles(age, city, homepage, users_id)
            VALUES($1, $2, $3, $4)
            ON CONFLICT (users_id)
            DO UPDATE SET age=$1, city=$2, homepage=$3
            RETURNING *
    `;
    const params = [age, city, homepage, usersid];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};

exports.updateUserPass = function(
    userId,
    firstName,
    lastName,
    email,
    hashedpassword
) {
    const q = `
    UPDATE users SET first_name=$2, last_name=$3, email=$4, hashed_password=$5
        WHERE id=$1
        RETURNING *
    `;
    const params = [userId, firstName, lastName, email, hashedpassword];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};
exports.updateUserWithoutPass = function(userId, firstName, lastName, email) {
    const q = `
        UPDATE users SET first_name=$2, last_name=$3, email=$4
        WHERE id=$1
        RETURNING *
    `;
    const params = [userId, firstName, lastName, email];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};
exports.updateInfo = function(age, city, homepage, usersid) {
    const q = `
        UPDATE users_profiles(age, city, homepage, users_id)
            VALUES($1, $2, $3, $4)
            ON CONFLICT (users_id)
            DO UPDATE SET age=age, city=city, homepage=homepage;
            RETURNING *
    `;
    const params = [age, city, homepage, usersid];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};

exports.updateSig = function(userid, firstname, lastname, signature) {
    const q = `
        UPDATE signatures SET first_name=$2, last_name=$3, signature=$4
            WHERE user_id=$1
            RETURNING *
    `;
    const params = [userid, firstname, lastname, signature];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};

exports.getNames = function() {
    const q = `SELECT * FROM signatures;`;
    return db.query(q).then(results => {
        return results.rows;
    });
};

exports.returnAllUsers = function() {
    const q = `SELECT * FROM users;`;
    return db.query(q).then(results => {
        return results.rows;
    });
};

exports.returnUser = function(email) {
    const q = `SELECT * FROM users WHERE email = $1;`;
    const params = [email];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.getSigById = function(userId) {
    const q = `SELECT signature FROM signatures WHERE user_id=$1;`;
    return db.query(q, [userId]).then(results => {
        return results.rows[0];
    });
};
exports.getAllSigByUserId = function(userId) {
    const q = `SELECT * FROM signatures WHERE user_id=$1;`;
    return db.query(q, [userId]).then(results => {
        return results.rows[0];
    });
};

exports.getAddInfo = function(userid) {
    const q = `SELECT * FROM users_profiles WHERE id=users_id;`;
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.getSigPageInfo = function() {
    const q = `SELECT * FROM signatures
              INNER JOIN users_profiles
              ON signatures.user_id = users_profiles.id;`;

    return db.query(q).then(results => {
        // console.log(results.rows);
        return results.rows;
    });
};

exports.getProfilePageInfo = function(userId) {
    const q = `SELECT *
FROM users
LEFT JOIN users_profiles ON users.id = users_profiles.users_id WHERE users.id = $1`;
    // console.log("usersId from data base getProfilePageInfo", userId);
    return db.query(q, [userId]).then(results => {
        return results.rows[0];
    });
};
