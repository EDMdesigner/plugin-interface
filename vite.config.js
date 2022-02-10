// vite.config.js
const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
	// config options
	build: {
		outDir: "./dist",
		target: "es2015",
		lib: {
			entry: path.resolve(__dirname, "./src/main.js"),
			name: "Chamaileon Plugin Interface",
			fileName: format => `main.${format}.js`,
		},
	},
});
