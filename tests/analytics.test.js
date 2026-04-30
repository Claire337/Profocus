// analytics.test.js
const analyticsController = require('../controllers/analyticsController');
const pool = require('../config/db');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn()
}));

describe('Analytics', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getStatusCounts', () => {
        test('should return correct status distribution', async () => {
            // Arrange
            const userId = 1;
            const mockStatusCounts = [
                { status: 'Pending', count: 5 },
                { status: 'Completed', count: 3 }
            ];

            pool.query.mockResolvedValueOnce([mockStatusCounts]);

            // Act
            const result = await analyticsController.getStatusCounts(userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT status, COUNT(*) as count FROM goals WHERE user_id = ? GROUP BY status',
                [userId]
            );
            expect(result).toEqual({
                Pending: 5,
                Completed: 3
            });
        });
    });

    describe('getTotalFocusTime', () => {
        test('should calculate correct total minutes', async () => {
            // Arrange
            const userId = 1;
            pool.query.mockResolvedValueOnce([[{ seconds: 9000 }]]); // 150 minutes

            // Act
            const result = await analyticsController.getTotalFocusTime(userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) as seconds FROM pomodoro_sessions WHERE user_id = ? AND completed = true',
                [userId]
            );
            expect(result).toBe(150); // 9000 seconds = 150 minutes
        });

        test('should return 0 when no sessions found', async () => {
            // Arrange
            const userId = 999;
            pool.query.mockResolvedValueOnce([[{ seconds: null }]]);

            // Act
            const result = await analyticsController.getTotalFocusTime(userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) as seconds FROM pomodoro_sessions WHERE user_id = ? AND completed = true',
                [userId]
            );
            expect(result).toBe(0);
        });
    });

    describe('getProductivityHeatmap', () => {
        test('should generate correct heatmap structure', async () => {
            // Arrange
            const userId = 1;
            const mockHeatmapData = [
                { hour_of_day: 9, day_of_week: 1, total_minutes: 45 },
                { hour_of_day: 14, day_of_week: 3, total_minutes: 75 }
            ];

            pool.query.mockResolvedValueOnce([mockHeatmapData]);

            // Act
            const result = await analyticsController.getProductivityHeatmap(userId);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('HOUR(start_time) as hour_of_day, DAYOFWEEK(start_time) as day_of_week'),
                [userId]
            );

            // Check heatmap structure
            expect(result).toHaveLength(7); // 7 days
            expect(result[0]).toHaveLength(24); // 24 hours per day

            // Check specific data points
            expect(result[0][9]).toBe(45); // Sunday, 9 AM
            expect(result[2][14]).toBe(75); // Tuesday, 2 PM
        });
    });
});