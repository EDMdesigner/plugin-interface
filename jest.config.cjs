const config = {
	setupFilesAfterEnv: [ "./test/unit/setupTests.js" ],
	testEnvironment: "jsdom",
	moduleFileExtensions: [
		"js",
	],
	transform: {},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transformIgnorePatterns: [],
	testMatch: [
		"**/?(*.)+(spec|test).[jt]s?(x)",
	],
	collectCoverage: true,
	collectCoverageFrom: [
		"src/**/*.{js,jsx}",
		"!**/node_modules/**",
		"!**/vendor/**",
	],
	coverageReporters: [
		"text",
		"text-summary",
		"html",
	],
	testPathIgnorePatterns: [
		"/node_modules/",
	],
};

module.exports = config;
