// vite.config.js
const path = require("path");

export default {
	// config options
	root: "src",
	build: {
		outDir: "../dist",
		target: "es2015",
		lib: {
			entry: path.resolve(__dirname, "./src/main.js"),
			name: "Chamaileon Plugin Interface",
			fileName: format => `chamaileon-plugin-interface.${format}.js`,
		},
	},
};
