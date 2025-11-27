const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  description: {
    type: String
  },
  files: [{
    path: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    originalname: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    cloudinaryId: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema); 