require('dotenv').config();
const User = require("../models/user_model");
const validator = require('validator');

const signUp = async (req, res) => {
    const { email, password } = req.body;
    let { name } = req.body;

    if (!name || !email || !password) {
        res.status(400).send({error:'Request Error: name, email and password are required.'});
        return;
    }

    if (!validator.isEmail(email)) {
        res.status(400).send({error:'Request Error: Invalid email format'});
        return;
    }

    name = validator.escape(name);

    const emails = await User.checkEmail(email);
    if (emails.length) {
        res.status(400).send({error:'Email already registered, please try another.'});
        return;
    }

    const { user, accessToken, expiresIn } = await User.signUp(name, email, password);

    return res.status(200).send({
        data: {
            access_token: accessToken,
            access_expired: expiresIn,
            user: {
                id: user.id,
                provider: user.provider,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        } 
    });
}

// only native sign in for now
const signIn = async (req, res) => {
    const { email, password, provider } = req.body;

    let result;
    switch(provider) {
        case 'native':
            result = await nativeSignIn(email, password);
            break;
        default:
            result = { error: 'Wrong Request' };
    }

    if (result.error) {
        const status_code = result.status ? result.status : 403;
        return res.status(status_code).send({error: result.error});
    }

    const { user, accessToken, expiresIn } = result;

    return res.status(200).send({
        data: {
            access_token: accessToken,
            access_expired: expiresIn,
            user: {
                id: user.id,
                provider: user.provider,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        }
    });
}

const nativeSignIn = async (email, password) => {
    if (!email || !password) {
        return { 
            error: 'Request Error: email and password are required.', 
            status: 400
        };
    }

    try {
        return await User.nativeSignIn(email, password);
    } catch(error) {
        return { error }
    }
}

const getProfile = async (req, res) => {
    const { email } = req;
    if (!email) {
        res.status(400).send({error:'Authentication required to access user info.'});
        return;
    }

    const result = await User.getProfile(email);

    if (result.errno) {
        return res.status(400).json({ error: `Something is wrong retrieving user data.` });
    }

    return res.status(200).json({ result });

}

module.exports = { 
    signUp,
    signIn,
    getProfile
}