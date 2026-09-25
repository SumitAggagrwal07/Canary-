const express = require('express');
const router = express.Router();
const {
  startTest,
  getTestById,
  getProjectTests,
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all test routes

router.post('/start', startTest);
router.get('/:id', getTestById);
router.get('/project/:projectId', getProjectTests);

module.exports = router;