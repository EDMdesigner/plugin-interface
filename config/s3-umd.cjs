const path = require("path");

module.exports = {
	// config options
	build: {
		outDir: "./dist/umd/",
		target: "es2015",
		sourcemap: true,
		lib: {
			entry: path.resolve(__dirname, "../src/main.js"),
			name: "window.pluginInterface",
			formats: [ "umd" ],
			fileName: () => "pluginInterface.js",
		},
	},
};
