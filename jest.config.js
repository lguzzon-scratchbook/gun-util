module.exports = {
    transform: {'^.+\.ts?$': 'ts-jest'},
    testEnvironment: 'node',
    testRegex: '/tests/.*\.(test|spec)?\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    modulePathIgnorePatterns: ['<rootDir>/dist'],
    setupFiles: ['localenv/register'],
    forceExit: true, // Gun keeps background workers running, which do not exit as of v0.2020.520.
};