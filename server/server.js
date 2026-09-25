const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/projects', require('./routes/projectRoutes.js'));
app.use('/api/tests', require('./routes/testRoutes.js'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Canary Load Engine' });
});

// Initialize background worker (optional logging)
require('./workers/loadTestWorker.js');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Canary API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server Error] Failed to start server:', err);
  }
};

startServer();