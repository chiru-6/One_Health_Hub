const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const reminderService = require('./services/reminderService');

// Load environment variables
dotenv.config();

// Check Cloudinary configuration
const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
};

console.log('Cloudinary Configuration Status:', {
  cloudName: cloudinaryConfig.cloudName !== 'your_cloud_name' ? 'Set' : 'Not set (using default)',
  apiKey: cloudinaryConfig.apiKey !== 'your_api_key' ? 'Set' : 'Not set (using default)',
  apiSecret: cloudinaryConfig.apiSecret !== 'your_api_secret' ? 'Set' : 'Not set (using default)'
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const medicalRoutes = require('./routes/medical');
const healthcareRoutes = require('./routes/healthcare');
const medicationRoutes = require('./routes/medication');

const app = express();
const httpServer = require('http').createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173','http://localhost:5175'], // Frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Start server only after MongoDB connection is established
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  // Start the reminder service
  reminderService.start();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit process with failure
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/healthcare', healthcareRoutes);
app.use('/api/medication', medicationRoutes);

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}