const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    type: {
      type: String,
      required: true, // e.g., 'HIGH_LATENCY', 'HIGH_ERROR_RATE', '5XX_SERVER_ERROR'
    },
    threshold: {
      type: Number,
      required: true,
    },
    actualValue: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', alertSchema);