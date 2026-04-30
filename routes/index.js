// routes/index.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const goalController = require('../controllers/goalController');
const analyticsController = require('../controllers/analyticsController');

// Home page
router.get('/', (req, res) => {
    res.render('index');
});

// Dashboard
router.get('/dashboard', auth, goalController.getGoals);

// Timer page
router.get('/timer', auth, goalController.getTimer);

// routes/index.js
router.get('/analytics', auth, (req, res) => {
    res.redirect('/analytics-data');
});

module.exports = router;