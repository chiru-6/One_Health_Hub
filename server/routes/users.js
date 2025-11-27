const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get current user's profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    console.log('User found:', user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform the data to match the frontend expectations
    const userData = {
      ...user.toObject(),
      medicalDetails: user.medicalDetails || {
        age: null,
        weight: null,
        dateOfBirth: null,
        medicalConditions: []
      }
    };

    console.log('Sending user data:', userData);
    res.json(userData);
  } catch (err) {
    console.error('Error in profile route:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    Object.assign(user, req.body);
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await user.remove();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 