// vite.config.js
const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
	// config options
	build: {
		outDir: "./dist",
		target: "es2015",
		sourcemap: true,
		lib: {
			entry: path.resolve(__dirname, "./src/main.js"),
			name: "pluginInterface",
			fileName: (format) => {
				if (format === "umd") return "pluginInterface.cjs";
				return "pluginInterface.js";
			},
		},
	},
	test: {
		globals: true,
		mockClear: true,
		environment: "jsdom",
		silent: true,
		setupFiles: [
			// "./test/setupFile.js",
		],
		coverage: {
			100: false,
		},
		// outputDiffLines: Infinity,
		// outputDiffMaxLines: Infinity,
		// outputDiffMaxSize: Infinity,
		// outputTruncateLength: Infinity,
	},
});
