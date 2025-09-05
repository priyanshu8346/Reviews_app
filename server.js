
// Entry point for the backend server
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require("./routes/authRoutes")
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/reviews', reviewRoutes);
app.use('/admin', adminRoutes);

// Health check route
app.get('/', (req, res) => {
  console.log('Health check: API is running...');
  res.send('API is running...');
});

// Start server and connect to DB
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();