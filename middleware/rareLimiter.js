const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, 
  message: { error: 'Too many requests from this IP, please try again later.' }
});

module.exports = { authLimiter };
