const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // Required by BullMQ
};

const connection = new Redis(redisConfig);

connection.on('connect', () => {
  console.log('[Redis] Connected to Redis server');
});

connection.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

module.exports = { connection, redisConfig };