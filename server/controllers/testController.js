const Test = require('../models/Test');
const Project = require('../models/Project');
const testQueue = require('../queues/testQueue');

// @desc    Start a new load test
// @route   POST /api/tests/start
// @access  Private
const startTest = async (req, res) => {
  try {
    const { projectId, duration, concurrencySteps } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Default test duration: 15s if omitted
    const testDuration = duration || 15;

    const test = await Test.create({
      projectId: project._id,
      status: 'PENDING',
      duration: testDuration,
      concurrencySteps: concurrencySteps || [
        { concurrency: 10, duration: 5 },
        { concurrency: 50, duration: 5 },
        { concurrency: 100, duration: 5 },
      ],
    });

    // Add job to BullMQ queue for Redis background worker execution
    await testQueue.add('run-load-test', {
      testId: test._id.toString(),
      targetUrl: project.targetUrl,
      method: project.method,
      headers: project.headers,
      body: project.body,
      concurrencySteps: test.concurrencySteps,
    });

    res.status(201).json({
      message: 'Load test queued successfully',
      testId: test._id,
      status: test.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get details of a specific test run
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate('projectId');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all test runs for a project
// @route   GET /api/tests/project/:projectId
// @access  Private
const getProjectTests = async (req, res) => {
  try {
    const tests = await Test.find({ projectId: req.params.projectId }).sort({
      createdAt: -1,
    });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startTest,
  getTestById,
  getProjectTests,
};