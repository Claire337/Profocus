// pomodoro.test.js
const Goal = require('../models/Goal');
const pool = require('../config/db');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn()
}));

describe('Pomodoro Sessions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Goal.recordPomodoro', () => {
        test('should record pomodoro session successfully', async () => {
            // Arrange
            const userId = 1;
            const goalId = 2;
            const startTime = new Date('2025-04-28T10:00:00Z');
            const endTime = new Date('2025-04-28T10:25:00Z');
            const completed = true;

            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Act
            const sessionId = await Goal.recordPomodoro(userId, goalId, startTime, endTime, completed);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO pomodoro_sessions (user_id, goal_id, start_time, end_time, completed) VALUES (?, ?, ?, ?, ?)',
                [userId, goalId, startTime, endTime, completed]
            );
            expect(sessionId).toBe(10);
        });

        test('should handle null goal ID', async () => {
            // Arrange
            const userId = 1;
            const goalId = null; // No goal selected
            const startTime = new Date('2025-04-28T10:00:00Z');
            const endTime = new Date('2025-04-28T10:25:00Z');
            const completed = true;

            pool.query.mockResolvedValueOnce([{ insertId: 11 }]);

            // Act
            const sessionId = await Goal.recordPomodoro(userId, goalId, startTime, endTime, completed);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO pomodoro_sessions (user_id, goal_id, start_time, end_time, completed) VALUES (?, ?, ?, ?, ?)',
                [userId, null, startTime, endTime, completed]
            );
            expect(sessionId).toBe(11);
        });
    });

    describe('Goal.updateStatus', () => {
        test('should update goal status to completed', async () => {
            // Arrange
            const goalId = 1;
            const userId = 2;

            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Act
            const result = await Goal.updateStatusToCompleted(goalId, userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE goals SET status = "Completed" WHERE id = ? AND user_id = ?',
                [goalId, userId]
            );
            expect(result).toBe(true);
        });
    });
});