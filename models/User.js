// User model
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    OTPHash:{
        type: String,
        required: true
    },
    OTPExpiry:{
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    },
    {timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
