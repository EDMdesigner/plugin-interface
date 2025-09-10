const path = require("path");

module.exports = {
	// config options
	build: {
		outDir: "./dist/es/",
		target: "es2015",
		sourcemap: true,
		lib: {
			entry: path.resolve(__dirname, "../src/main.js"),
			name: "window.pluginInterface",
			formats: [ "es" ],
			fileName: () => "pluginInterface.js",
		},
	},
};
