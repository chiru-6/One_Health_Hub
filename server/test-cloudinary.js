require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('=== TESTING CLOUDINARY CONNECTION ===');
console.log('Environment variables:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the connection by getting account details
cloudinary.api.ping()
  .then(result => {
    console.log('Cloudinary connection successful!');
    console.log('Account details:', result);
    console.log('=== CLOUDINARY TEST COMPLETED ===');
  })
  .catch(error => {
    console.error('Cloudinary connection failed!');
    console.error('Error:', error);
    console.error('=== CLOUDINARY TEST FAILED ===');
  }); 