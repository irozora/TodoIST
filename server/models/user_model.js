require('dotenv').config();
const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon');
const { generateToken } = require('../util/jwtToken')
const bcrypt = require('bcrypt');
const salt = parseInt(process.env.BCRYPT_SALT);
const defaultUserPic = process.env.DEFAULT_USER_PIC_URL;

const checkEmail = async (email) => {
    const result = await query(`SELECT id, name, email FROM user WHERE email = ?;`, email);
    return result;
}

const signUp = async (name, email, password) => {
    const user = {
        name: name,
        email: email,
        password: bcrypt.hashSync(password, salt),
        picture: defaultUserPic,
        provider: 'native'
    };

    const { accessToken, expiresIn } = await generateToken(user);

    try {
        await startTransaction();
        const result = await query(`INSERT INTO user SET ?;`, user);
        user.id = result.insertId;
        await endWithCommit();
        return { user, accessToken, expiresIn }
    } catch (error) {
        await rollback();
        return { error };
    }
} 

const nativeSignIn = async (email, password) => {
    try {
        await startTransaction();
        const users = await query(`SELECT id, name, email, password, picture, provider FROM user WHERE email=?;`, email);
        const user = users[0]
        
        if (!bcrypt.compareSync(password, user.password)){
            await endWithCommit();
            return {error: 'Incorrect password.'};
        }
 
        const { accessToken, expiresIn } = await generateToken(user);
        await endWithCommit();
        return { user, accessToken, expiresIn };
    } catch (error) {
        await rollback();
        return { error };
    }
} 

module.exports = { 
    checkEmail,
    signUp,
    nativeSignIn
}