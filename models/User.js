
// User model for authentication and role management
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
        required: false
    },
    OTPExpiry:{
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
},
{timestamps: true }
);

// Log when a user is created or updated (for debugging)
userSchema.post('save', function(doc) {
  console.log(`[UserModel] User saved: ${doc.email}, role: ${doc.role}`);
});

module.exports = mongoose.model('User', userSchema);
