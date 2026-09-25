const { Queue } = require('bullmq');
const { redisConfig } = require('../config/redis');

const testQueue = new Queue('load-test-queue', {
  connection: redisConfig,
});

module.exports = testQueue;