// vite.config.js
const { defineConfig, loadEnv } = require("vite");

module.exports = defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	if (env?.VITE_BUILD_TARGET === "s3-umd") {
		return require("./config/s3-umd.cjs");
	}
	if (env?.VITE_BUILD_TARGET === "s3-es") {
		return require("./config/s3-es.cjs");
	}

	return require("./config/npm.cjs");
});
