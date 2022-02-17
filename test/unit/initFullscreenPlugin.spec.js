import initFullscreenPlugin from "../../src/initFullscreenPlugin";

describe("initFullscreenPlugin tests", function () {
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip("inits properly", async function () {
		let plugin;
		try {
			plugin = await initFullscreenPlugin(
				{
					id: "someId",
					src: "someSrc",
					data: {},
					settings: {},
					hooks: {},
				},
			);
		} catch (error) {
			console.log(error);
		}
		console.log(plugin);
		expect(plugin).toHaveProperty("_container");
		expect(plugin).toHaveProperty("_src");
		expect(plugin).toHaveProperty("methods");
		expect(plugin).toHaveProperty("showSplashScreen");
		expect(plugin).toHaveProperty("hideSplashScreen");
		expect(plugin).toHaveProperty("show");
		expect(plugin).toHaveProperty("hide");
		expect(plugin).toHaveProperty("destroy");
	});
});
