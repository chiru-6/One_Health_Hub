const mongoose = require('mongoose');

const timingSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:mm)
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:mm format`
    }
  },
  takenDates: [{
    type: Date,
    default: []
  }]
}, { _id: true });

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pillName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true,
    default: 'daily'
  },
  timings: [timingSchema],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  description: {
    type: String
  },
  foodTiming: {
    type: String,
    enum: ['before', 'after'],
    required: true,
    default: 'before'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  lastReminderSent: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Medication', medicationSchema); 