// backend/util/jwtUtil.js

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET // Replace with a strong and secure secret key
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

const sign = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
};

const verify = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired:', error);
      throw new Error('Token expired');
    } else {
      console.error('Error verifying token:', error);
      throw new Error('Invalid token');
    }
  }
};

module.exports = {
  sign,
  verify,
};
