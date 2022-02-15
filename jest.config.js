const config = {
	setupFilesAfterEnv: [ "./test/unit/setupTests.js" ],
	testEnvironment: "jsdom",
	moduleFileExtensions: [
		"js",
	],
	transform: {
		"^.+\\.(js|jsx)$": "babel-jest",
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transformIgnorePatterns: [
		"node_modules/(?!@EDMdesigner)",
	],
	testMatch: [
		"**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)",
	],
	testURL: "http://localhost/",
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
