const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { adminEmails } = require('../config');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];

function makeTransporter() {
  // Generic SMTP (works great with Ethereal or any SMTP)
  // ETHEREAL: host=smtp.ethereal.email, port=587, secure=false
  // GMAIL (less secure): host=smtp.gmail.com, port=465, secure=true
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

// Step 1: Request OTP
exports.requestAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if email is in allowed admin list
    if (!adminEmails.includes(normalizedEmail)) {
      return res.status(403).json({ success: false, error: 'Not authorized as admin' });
    }

    // Find or create admin user
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = new User({
        email: normalizedEmail,
        role: 'admin'
      });
    } else {
      user.role = 'admin'; // enforce admin role if already exists
    }

    // Generate OTP
    const OTP = generateOTP();
    const OTPHash = hashOTP(OTP);
    const OTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry 
    user.OTP = OTP;
    user.OTPExpiry = OTPExpiry;
    user.isVerified = true;
    user.OTPHash = OTPHash;  
    await user.save();

    const transporter = makeTransporter();
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"AI Reviews" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your OTP Code',
          text: `Your OTP is ${OTP}. It expires in 5 minutes.`,
          html: `<p>Your OTP is <b>${OTP }</b>. It expires in 5 minutes.</p>`,
        });
    
        // If using Ethereal, you can log the preview URL for testing:
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    

  } catch (err) {
    console.error("Error in requestAdminOtp:", err);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
};

// Step 2: Verify OTP
exports.verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Only emails in env are allowed
    if (!adminEmails.includes(normalizedEmail)) {
      return res.status(403).json({ success: false, error: 'Not authorized as admin' });
    }

    const user = await User.findOne({ email: normalizedEmail, role: 'admin' });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin not found, request OTP again' });
    }

    if (!user.OTP || user.OTPHash !== hashOTP(otp) || user.OTPExpiry < Date.now()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Clear OTP after success
    user.OTP = undefined;
    user.OTPExpiry = undefined;
    user.OTPHash = undefined;
    user.isVerified = true;
    user.role = 'admin'; // ensure role is admin
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });

  } catch (err) {
    console.error("Error in verifyAdminOtp:", err);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};
