require("dotenv").config();
const { NODE_ENV, DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_CONNECTION } = process.env;
const mysql = require("mysql");
const { promisify } = require('util');
const connectionLimit = DB_CONNECTION || 10;
const env = NODE_ENV || 'production';

const mysqlConfig = {
    production: { // for EC2 machine
        connectionLimit: connectionLimit,
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE
    },
    development: { // for localhost development
        connectionLimit: connectionLimit,
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE
    },
    test: { 
        connectionLimit: connectionLimit,
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE
    }
};

const pool = mysql.createPool(mysqlConfig[env]);

const query = promisify(pool.query).bind(pool);

function startTransaction() {
    return new Promise((resolve, reject) => {
        pool.query("START TRANSACTION;", (error, result) => {
            if (error) reject(error);
            resolve(result);
        });
    });
}

function endWithCommit() {
    return new Promise((resolve, reject) => {
        pool.query("COMMIT;", (error, result) => {
            if (error) reject(error);
            resolve(result);
        });
    });
}

function rollback() {
    return new Promise((resolve, reject) => {
        pool.query("ROLLBACK;", (error, result) => {
            if (error) reject(error);
            resolve(result);
        });
    });
}

module.exports = { 
    query, 
    startTransaction, 
    endWithCommit, 
    rollback 
};

