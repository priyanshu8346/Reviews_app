// Auth controller
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User'); 

function makeTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/** Generate 6-digit OTP as string */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}


/** POST /auth/send-otp  { email } */

exports.sendOTP = async (req, res) => {
    try{
        const { email } = req.body || '';
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const OTP = generateOTP();
        const OTPHash = hashOTP(OTP);
        const OTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        const user = await User.findOneAndUpdate(
        {email },
        { OTPHash, OTPExpiry, isVerified: false, role: 'user' }, // default role as 'user'
        { new: true, upsert: true }
    )

    // Send email
    const transporter = makeTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"AI Reviews" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${OTP}. It expires in 5 minutes.`,
      html: `<h2>Welcome to ReviewAI 🎉</h2>
      <p>Your OTP is <b>${OTP}</b>. It expires in 5 minutes.</p>`,
    });

    // If using Ethereal, you can log the preview URL for testing:
    // console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    // console.error('sendOTP error:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
    }

/** POST /auth/verify-otp  { email, otp } */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.OTPHash || !user.OTPExpiry) {
      return res.status(400).json({ error: 'OTP not requested or user not found' });
    }

    if (user.OTPExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const isMatch = user.OTPHash === hashOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark verified and clear OTP fields
    user.isVerified = true;
    user.OTPHash = undefined;
    user.OTPExpiry = undefined;

    await user.save();

    // Issue JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ success: true, token });
  } catch (err) {
    //  console.error('verifyOTP error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
};
