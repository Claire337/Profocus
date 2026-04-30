// auth.test.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const pool = require('../config/db');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn()
}));

describe('User Authentication', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('User.findByEmail', () => {
        test('should return user when found', async () => {
            // Arrange
            const mockUser = { id: 1, email: 'test@example.com', password: 'hashedpassword' };
            pool.query.mockResolvedValueOnce([[mockUser]]);

            // Act
            const result = await UserModel.findByEmail('test@example.com');

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = ?',
                ['test@example.com']
            );
            expect(result).toEqual(
                expect.objectContaining({
                    id: 1,
                    email: 'test@example.com'
                })
            );
        });

        test('should return null when user not found', async () => {
            // Arrange
            pool.query.mockResolvedValueOnce([[]]);

            // Act
            const result = await UserModel.findByEmail('nonexistent@example.com');

            // Assert
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = ?',
                ['nonexistent@example.com']
            );
            expect(result).toBeNull();
        });
    });

    describe('User.create', () => {
        test('should create user with hashed password', async () => {
            // Arrange
            const username = 'testuser';
            const email = 'test@example.com';
            const password = 'TestPassword123';

            // Mock bcrypt hash
            jest.spyOn(bcrypt, 'genSalt').mockResolvedValueOnce('mocksalt');
            jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashedpassword');

            pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

            // Act
            const userId = await UserModel.create(username, email, password);

            // Assert
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 'mocksalt');
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, 'hashedpassword']
            );
            expect(userId).toBe(1);
        });
    });
});