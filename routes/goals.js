// routes/goals.js
const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/auth');

// Debug every request that reaches /goals
router.use((req, res, next) => {
    console.log(`[GOALS ROUTE] ${req.method} ${req.originalUrl}`);
    console.log('[GOALS ROUTE BODY]', req.body);
    next();
});

// Get all goals for a user
router.get('/', auth, goalController.getGoals);

// Create a new goal
router.post('/', auth, goalController.createGoal);

// Record Pomodoro session
router.post('/pomodoro', auth, goalController.recordPomodoro);

// Get goal details
router.get('/:id/details', auth, goalController.getGoalDetails);

// Mark goal as completed
router.post('/:id/complete', auth, goalController.completeGoal);

// Update goal timer status
router.post('/timer-status', auth, goalController.updateGoalTimerStatus);

// Update a goal
router.put('/:id', auth, goalController.updateGoal);

// Delete a goal
router.delete('/:id', auth, goalController.deleteGoal);

module.exports = router;