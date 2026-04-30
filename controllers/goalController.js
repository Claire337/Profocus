// controllers/goalController.js
const pool = require('../config/db');

function clean(value, fallback = '') {
    if (value === undefined || value === null) return fallback;
    return String(value).trim();
}

function toInt(value, fallback = 1) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalisePriority(value) {
    const priority = clean(value, 'Medium');

    if (priority === 'Low') return 'Low';
    if (priority === 'Medium') return 'Medium';
    if (priority === 'High') return 'High';

    const lower = priority.toLowerCase();

    if (lower === 'low') return 'Low';
    if (lower === 'medium') return 'Medium';
    if (lower === 'high') return 'High';

    return 'Medium';
}

function normaliseStatus(value) {
    const status = clean(value, 'Pending');

    if (status === 'Pending') return 'Pending';
    if (status === 'Completed') return 'Completed';
    if (status === 'In Progress') return 'In Progress';

    const lower = status.toLowerCase();

    if (lower === 'completed') return 'Completed';
    if (lower === 'in progress') return 'In Progress';

    return 'Pending';
}

function normaliseDeadline(value) {
    const raw = clean(value, '');

    if (!raw) return null;

    // Safari sometimes displays yyyy/mm/dd, MySQL DATE prefers yyyy-mm-dd
    return raw.replace(/\//g, '-');
}

function getTitle(body) {
    return clean(
        body.title ||
        body.goalTitle ||
        body.goal_title ||
        body.name ||
        body.goalName,
        ''
    );
}

// Get all goals for logged-in user
exports.getGoals = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/auth/login');
        }

        const [goals] = await pool.query(
            `SELECT *
             FROM goals
             WHERE user_id = ?
             ORDER BY
                CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
                deadline ASC,
                CASE priority
                    WHEN 'High' THEN 3
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 1
                    ELSE 0
                END DESC`,
            [req.user.id]
        );

        console.log('[GET GOALS] user:', req.user);
        console.log('[GET GOALS] goals:', goals);

        return res.render('dashboard', {
            goals: goals || [],
            user: req.user
        });
    } catch (err) {
        console.error('[GET GOALS ERROR]', err);

        return res.render('dashboard', {
            goals: [],
            user: req.user
        });
    }
};

// Create a new goal
exports.createGoal = async (req, res) => {
    try {
        console.log('================ CREATE GOAL HIT ================');
        console.log('[CREATE GOAL USER]', req.user);
        console.log('[CREATE GOAL BODY]', req.body);

        if (!req.user || !req.user.id) {
            console.log('[CREATE GOAL FAILED] No logged-in user');
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/auth/login');
        }

        const title = getTitle(req.body);
        const description = clean(req.body.description, '');
        const category = clean(req.body.category, 'Other') || 'Other';
        const priority = normalisePriority(req.body.priority);
        const deadline = normaliseDeadline(req.body.deadline);
        const estimatedPomodoros = toInt(
            req.body.estimated_pomodoros || req.body.estimatedPomodoros,
            1
        );

        console.log('[CREATE GOAL CLEANED DATA]', {
            user_id: req.user.id,
            title,
            description,
            category,
            priority,
            deadline,
            estimatedPomodoros
        });

        if (!title) {
            console.log('[CREATE GOAL FAILED] Missing title');
            req.flash('error_msg', 'Title is required');
            return res.redirect('/dashboard');
        }

        const [result] = await pool.query(
            `INSERT INTO goals
             (user_id, title, description, category, priority, deadline, status, estimated_pomodoros)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                description,
                category,
                priority,
                deadline,
                'Pending',
                estimatedPomodoros
            ]
        );

        console.log('[CREATE GOAL SUCCESS] inserted id:', result.insertId);

        req.flash('success_msg', 'Goal added successfully');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('================ CREATE GOAL ERROR ================');
        console.error(err);
        console.error('===================================================');

        req.flash('error_msg', 'Failed to create goal');
        return res.redirect('/dashboard');
    }
};

// Update a goal
exports.updateGoal = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/auth/login');
        }

        const goalId = req.params.id;

        const title = getTitle(req.body);
        const description = clean(req.body.description, '');
        const category = clean(req.body.category, 'Other') || 'Other';
        const priority = normalisePriority(req.body.priority);
        const status = normaliseStatus(req.body.status);
        const deadline = normaliseDeadline(req.body.deadline);
        const estimatedPomodoros = toInt(
            req.body.estimated_pomodoros || req.body.estimatedPomodoros,
            1
        );

        if (!title) {
            req.flash('error_msg', 'Title is required');
            return res.redirect('/dashboard');
        }

        const [result] = await pool.query(
            `UPDATE goals
             SET title = ?,
                 description = ?,
                 category = ?,
                 priority = ?,
                 status = ?,
                 deadline = ?,
                 estimated_pomodoros = ?
             WHERE id = ? AND user_id = ?`,
            [
                title,
                description,
                category,
                priority,
                status,
                deadline,
                estimatedPomodoros,
                goalId,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            req.flash('error_msg', 'Goal not found or access denied');
        } else {
            req.flash('success_msg', 'Goal updated successfully');
        }

        return res.redirect('/dashboard');
    } catch (err) {
        console.error('[UPDATE GOAL ERROR]', err);
        req.flash('error_msg', 'Failed to update goal');
        return res.redirect('/dashboard');
    }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/auth/login');
        }

        const [result] = await pool.query(
            'DELETE FROM goals WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            req.flash('error_msg', 'Goal not found or access denied');
        } else {
            req.flash('success_msg', 'Goal deleted successfully');
        }

        return res.redirect('/dashboard');
    } catch (err) {
        console.error('[DELETE GOAL ERROR]', err);
        req.flash('error_msg', 'Failed to delete goal');
        return res.redirect('/dashboard');
    }
};

// Timer page
exports.getTimer = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/auth/login');
        }

        const [goals] = await pool.query(
            `SELECT *
             FROM goals
             WHERE user_id = ? AND status != 'Completed'
             ORDER BY deadline ASC, priority DESC`,
            [req.user.id]
        );

        return res.render('timer', {
            goals: goals || [],
            user: req.user
        });
    } catch (err) {
        console.error('[GET TIMER ERROR]', err);

        return res.render('timer', {
            goals: [],
            user: req.user
        });
    }
};

// Record Pomodoro session
exports.recordPomodoro = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Please log in first'
            });
        }

        const goalId = req.body.goal_id || req.body.goalId;
        const duration = toInt(req.body.duration, 25);

        if (!goalId) {
            return res.status(400).json({
                success: false,
                message: 'Goal id is required'
            });
        }

        const [goals] = await pool.query(
            'SELECT id FROM goals WHERE id = ? AND user_id = ?',
            [goalId, req.user.id]
        );

        if (!goals || goals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        try {
            await pool.query(
                `INSERT INTO pomodoro_sessions
                 (user_id, goal_id, duration, completed_at)
                 VALUES (?, ?, ?, NOW())`,
                [req.user.id, goalId, duration]
            );
        } catch (sessionErr) {
            console.warn('[POMODORO SESSION WARNING]', sessionErr.message);
        }

        try {
            await pool.query(
                `UPDATE goals
                 SET completed_pomodoros = COALESCE(completed_pomodoros, 0) + 1
                 WHERE id = ? AND user_id = ?`,
                [goalId, req.user.id]
            );
        } catch (countErr) {
            console.warn('[POMODORO COUNT WARNING]', countErr.message);
        }

        return res.json({
            success: true,
            message: 'Pomodoro session recorded'
        });
    } catch (err) {
        console.error('[RECORD POMODORO ERROR]', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to record Pomodoro session'
        });
    }
};

// Get goal details
exports.getGoalDetails = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Please log in first'
            });
        }

        const [goals] = await pool.query(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (!goals || goals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        return res.json({
            success: true,
            goal: goals[0]
        });
    } catch (err) {
        console.error('[GET GOAL DETAILS ERROR]', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to load goal details'
        });
    }
};

// Mark goal as completed
exports.completeGoal = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/auth/login');
        }

        const [result] = await pool.query(
            `UPDATE goals
             SET status = 'Completed'
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            req.flash('error_msg', 'Goal not found or access denied');
        } else {
            req.flash('success_msg', 'Goal completed successfully');
        }

        return res.redirect('/dashboard');
    } catch (err) {
        console.error('[COMPLETE GOAL ERROR]', err);
        req.flash('error_msg', 'Failed to complete goal');
        return res.redirect('/dashboard');
    }
};

// Update goal timer status
exports.updateGoalTimerStatus = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Please log in first'
            });
        }

        const goalId = req.body.goal_id || req.body.goalId || req.body.id;
        const timerStatus = clean(
            req.body.timer_status || req.body.timerStatus || req.body.status,
            ''
        );

        if (!goalId) {
            return res.status(400).json({
                success: false,
                message: 'Goal id is required'
            });
        }

        try {
            await pool.query(
                `UPDATE goals
                 SET timer_status = ?
                 WHERE id = ? AND user_id = ?`,
                [timerStatus, goalId, req.user.id]
            );
        } catch (timerErr) {
            console.warn('[TIMER STATUS WARNING]', timerErr.message);
        }

        return res.json({
            success: true,
            message: 'Timer status updated'
        });
    } catch (err) {
        console.error('[UPDATE TIMER STATUS ERROR]', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to update timer status'
        });
    }
};