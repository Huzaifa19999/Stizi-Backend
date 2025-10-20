const express = require('express');
const router = express.Router();
const { signup, verify } = require('../controllers/authController');

const { authLimiter } = require('../middleware/rareLimiter');

router.post('/signup', authLimiter, signup); 
router.post('/verify', authLimiter, verify);

module.exports = router;
