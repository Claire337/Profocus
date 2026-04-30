module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    testMatch: ['**/*.test.js'],
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
};