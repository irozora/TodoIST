const jwt = require('jsonwebtoken');
const tokenSecret = process.env.JWT_TOKEN_SECRET;
const expiresIn = process.env.TOKEN_EXPIRE || 3600000;

const generateToken = async (data) => {
    // password should already bcrypt at this point
    let { name, email, password, picture } = data;
    const payload = {
        name, 
        email,
        password,
        picture
    };

    const accessToken = jwt.sign(payload, tokenSecret, { expiresIn: expiresIn });

    return { accessToken, expiresIn };
}

const authenticateToken = async (req, res, next) => {
    const token = req.get('Authorization');
    const accessToken = token ? token.replace('Bearer ', '') : token;

    jwt.verify(accessToken, tokenSecret, (error, user) => {
      if (error) return res.status(400).send({error: 'Wrong Request: authorization is required.'});
      
      req.email = user.email;
      next();
    })
}

module.exports = {
    generateToken,
    authenticateToken
};
