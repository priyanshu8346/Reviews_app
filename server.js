// Entry point for the backend server
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require("./routes/authRoutes")
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

//midlleware
// Use CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/reviews', reviewRoutes);


// Routes
app.get('/', (req, res) => res.send('API is running...'));

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(process.env.PORT, () => console.log(`Server running on ${process.env.PORT}`));
};

startServer();