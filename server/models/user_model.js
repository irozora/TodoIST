require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon')

const signUp = async () => {
    
} 

module.exports = { 
    signUp
}