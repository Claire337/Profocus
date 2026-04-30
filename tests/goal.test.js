// goal.test.js
const Goal = require('../models/Goal');
const pool = require('../config/db');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn()
}));

describe('Goal Management', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Goal.findByUserId', () => {
        test('should return goals for user', async () => {
            // Arrange
            const userId = 1;
            const mockGoals = [
                { id: 1, user_id: 1, title: 'Test Goal 1', priority: 'High' },
                { id: 2, user_id: 1, title: 'Test Goal 2', priority: 'Medium' }
            ];
            pool.query.mockResolvedValueOnce([mockGoals]);

            // Act
            const goals = await Goal.findByUserId(userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC, priority DESC',
                [userId]
            );
            expect(goals.length).toBe(2);
            expect(goals[0].title).toBe('Test Goal 1');
            expect(goals[1].title).toBe('Test Goal 2');
        });

        test('should return empty array when no goals found', async () => {
            // Arrange
            const userId = 999;
            pool.query.mockResolvedValueOnce([[]]);

            // Act
            const goals = await Goal.findByUserId(userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC, priority DESC',
                [userId]
            );
            expect(goals).toEqual([]);
        });
    });

    describe('Goal.create', () => {
        test('should create goal with all fields', async () => {
            // Arrange
            const userId = 1;
            const title = 'New Goal';
            const description = 'Goal description';
            const category = 'Work';
            const priority = 'High';
            const deadline = '2025-05-30';

            pool.query.mockResolvedValueOnce([{ insertId: 5 }]);

            // Act
            const goalId = await Goal.create(userId, title, description, category, priority, deadline);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO goals (user_id, title, description, category, priority, deadline) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, title, description, category, priority, deadline]
            );
            expect(goalId).toBe(5);
        });

        test('should handle null deadline', async () => {
            // Arrange
            const userId = 1;
            const title = 'New Goal';
            const description = 'Goal description';
            const category = 'Work';
            const priority = 'High';
            const deadline = null;

            pool.query.mockResolvedValueOnce([{ insertId: 6 }]);

            // Act
            const goalId = await Goal.create(userId, title, description, category, priority, deadline);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO goals (user_id, title, description, category, priority, deadline) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, title, description, category, priority, null]
            );
            expect(goalId).toBe(6);
        });
    });

    describe('Goal.update', () => {
        test('should update goal and return true on success', async () => {
            // Arrange
            const goalId = 1;
            const title = 'Updated Goal';
            const description = 'Updated description';
            const category = 'Study';
            const priority = 'Medium';
            const status = 'Completed';
            const deadline = '2025-06-15';

            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Act
            const result = await Goal.update(goalId, title, description, category, priority, status, deadline);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE goals SET title = ?, description = ?, category = ?, priority = ?, status = ?, deadline = ? WHERE id = ?',
                [title, description, category, priority, status, deadline, goalId]
            );
            expect(result).toBe(true);
        });

        test('should return false when no rows affected', async () => {
            // Arrange
            const goalId = 999; // Non-existent goal
            const title = 'Updated Goal';
            const description = 'Updated description';
            const category = 'Study';
            const priority = 'Medium';
            const status = 'Completed';
            const deadline = '2025-06-15';

            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Act
            const result = await Goal.update(goalId, title, description, category, priority, status, deadline);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE goals SET title = ?, description = ?, category = ?, priority = ?, status = ?, deadline = ? WHERE id = ?',
                [title, description, category, priority, status, deadline, goalId]
            );
            expect(result).toBe(false);
        });
    });
});