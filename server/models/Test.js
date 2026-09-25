const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    duration: {
      type: Number, // Test duration in seconds
      required: true,
    },
    concurrencySteps: [
      {
        concurrency: Number,
        duration: Number,
      },
    ],
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    requestsPerSecond: { type: Number, default: 0 },
    averageLatency: { type: Number, default: 0 },
    p95Latency: { type: Number, default: 0 },
    p99Latency: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    statusCodes: {
      type: Map,
      of: Number,
      default: {},
    },
    capacityEstimate: {
      stableCapacity: Number,
      recommendedRange: String,
      degradationPoint: Number,
      criticalPoint: Number,
    },
    reliabilityStatus: {
      type: String,
      enum: ['HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Test', testSchema);