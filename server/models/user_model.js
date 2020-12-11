require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon');

const signUp = async () => {
    
} 

module.exports = { 
    signUp
}