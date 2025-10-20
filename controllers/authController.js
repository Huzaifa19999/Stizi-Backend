const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendSMS } = require('../utils/sms');

const OTP_LENGTH = 6;
const MAX_VERIFY_ATTEMPTS = 5;

function generateNumericOtp(len = OTP_LENGTH) {
  let otp = '';
  for (let i = 0; i < len; i++) otp += Math.floor(Math.random() * 10);
  return otp;
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

exports.signup = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    const otp = generateNumericOtp();
    const otpHash = hashOtp(otp);
    const expireMinutes = Number(process.env.OTP_EXPIRE_MINUTES) || 5;
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phone },
      { otpHash, expiresAt, attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const message = `Your verification code is ${otp}. It expires in ${expireMinutes} minutes.`;
    await sendSMS(phone, message);

   
    return res.json({ success: true, message: 'OTP sent (dev).', demoOtp: otp });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.verify = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

    const record = await Otp.findOne({ phone });
    if (!record) return res.status(400).json({ error: 'No OTP request found for this phone' });

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ phone });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await Otp.deleteOne({ phone });
      return res.status(429).json({ error: 'Too many failed attempts. Request a new OTP.' });
    }

    const otpHash = hashOtp(otp);
    if (otpHash !== record.otpHash) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    await Otp.deleteOne({ phone });

    const token = jwt.sign(
      { userId: user._id.toString(), phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ success: true, token, user: { id: user._id, phone: user.phone } });
  } catch (err) {
    console.error('verify error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
