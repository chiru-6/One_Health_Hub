const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const mongoose = require('mongoose');

// Create a new medication
router.post('/', async (req, res) => {
  try {
    const { userId, pillName, dosage, frequency, timings, startDate, endDate, description, foodTiming } = req.body;
    
    console.log('Request body:', req.body);
    
    // Validate required fields
    if (!userId || !pillName || !dosage || !timings || !Array.isArray(timings) || timings.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or invalid timings' });
    }

    // Validate each timing
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const timing of timings) {
      if (!timeRegex.test(timing.time)) {
        return res.status(400).json({ message: 'Invalid time format. Use HH:mm format' });
      }
    }

    // Create timings array with proper structure
    const formattedTimings = timings.map(timing => ({
      time: timing.time,
      taken: false
    }));

    const medication = new Medication({
      userId,
      pillName,
      dosage,
      frequency: frequency || 'daily',
      timings: formattedTimings,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description,
      foodTiming: foodTiming || 'before',
      status: 'active'
    });

    console.log('Medication object before save:', medication);
    await medication.save();
    console.log('Medication saved successfully:', medication);
    res.status(201).json(medication);
  } catch (err) {
    console.error('Error creating medication:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get all medications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const medications = await Medication.find({ userId: req.params.userId })
      .sort({ 'timings.time': 1 });
    res.json(medications);
  } catch (err) {
    console.error('Error fetching medications:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get active medications for a user
router.get('/user/:userId/active', async (req, res) => {
  try {
    console.log('Fetching active medications for user:', req.params.userId);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      console.error('Invalid user ID:', req.params.userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const medications = await Medication.find({
      userId: req.params.userId,
      status: 'active'
    }).sort({ 'timings.time': 1 });

    console.log('Found medications:', medications.map(med => ({
      id: med._id,
      timings: med.timings,
      pillName: med.pillName
    })));

    res.json(medications);
  } catch (err) {
    console.error('Error in /user/:userId/active:', err);
    res.status(500).json({ 
      message: 'Error fetching active medications',
      error: err.message 
    });
  }
});

// Update medication taken status for a specific timing
router.patch('/:id/timing/:timingId/taken', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    const timing = medication.timings.id(req.params.timingId);
    if (!timing) {
      return res.status(404).json({ message: 'Timing not found' });
    }

    timing.taken = !timing.taken;
    timing.lastTaken = !timing.taken ? null : new Date();
    await medication.save();

    res.json(medication);
  } catch (err) {
    console.error('Error updating medication status:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update medication status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const medication = await Medication.findById(req.params.id);
    
    if (!medication) return res.status(404).json({ message: 'Medication not found' });
    
    medication.status = status;
    await medication.save();
    res.json(medication);
  } catch (err) {
    console.error('Error updating medication status:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update medication details
router.patch('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ message: 'Medication not found' });

    const updates = req.body;
    Object.keys(updates).forEach(update => {
      if (update !== 'timings') {
        medication[update] = updates[update];
      }
    });

    if (updates.timings) {
      medication.timings = updates.timings.map(time => ({
        time: time.time,
        taken: time.taken || false,
        lastTaken: time.lastTaken
      }));
    }

    await medication.save();
    res.json(medication);
  } catch (err) {
    console.error('Error updating medication:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a medication
router.delete('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    await medication.deleteOne();
    res.json({ message: 'Medication deleted' });
  } catch (err) {
    console.error('Error deleting medication:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get medication history
router.get('/:id/history', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ message: 'Medication not found' });

    const history = await MedicationHistory.find({ medicationId: req.params.id })
      .sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update medication taken status for a specific timing and date
router.patch('/:id/timing/:timingId/taken', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    const timing = medication.timings.id(req.params.timingId);
    if (!timing) {
      return res.status(404).json({ message: 'Timing not found' });
    }

    // Initialize takenDates array if it doesn't exist
    if (!timing.takenDates) {
      timing.takenDates = [];
    }

    const targetDate = new Date(date);
    const dateExists = timing.takenDates.some(d => 
      isSameDay(new Date(d), targetDate)
    );

    if (dateExists) {
      // Remove the date if it exists
      timing.takenDates = timing.takenDates.filter(d => 
        !isSameDay(new Date(d), targetDate)
      );
    } else {
      // Add the date if it doesn't exist
      timing.takenDates.push(targetDate);
    }

    await medication.save();
    res.json(medication);
  } catch (err) {
    console.error('Error updating medication status:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 