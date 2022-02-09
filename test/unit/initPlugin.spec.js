import createInitPlugin from "../../src/initPlugin";
import createProvidePlugin from "../../src/providePlugin";
import { addFixEvents, removeFixEvents } from "./testUtils/fixEvents";
import { sideEffectsMapper, createEventListenerSpy, resetJSDOM } from "./testUtils/jsdomReset";

describe("provide plugin tests", function () {
	const sideEffects = sideEffectsMapper(window, document);
	beforeAll(() => {
		createEventListenerSpy(sideEffects);
	});
	beforeEach(() => {
		resetJSDOM(document, sideEffects);
	});

	describe("providePlugin", () => {
		let pluginIframe;
		let body;
		const warnings = [];
		console.warn = payload => warnings.push(payload);
		const messages = [];
		const errors = [];
		const hooks = ["onResetButtonClicked", "onSaveButtonClicked", "onClose"];
		const hookFunction = {
		};
		hooks.forEach((hook) => {
			hookFunction[hook] = data => messages.push(data);
		});

		const settings = {
			background: "#abcdef",
		};
		const data = {
			title: "Default title",
			description: "Default description",
		};

		function updateData(newData) {
			data.title = newData.title;
			data.description = newData.description;
		}

		function updateSettings(newSettings) {
			settings.background = newSettings.background;
		}

		const methods = {
			updateData,
			updateSettings,
		};

		beforeEach(function () {
			pluginIframe = document.createElement("iframe");
			pluginIframe.src = "";
			pluginIframe.allowFullscreen = "allowfullscreen";
			body = document.querySelector("body");
			body.appendChild(pluginIframe);

			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
		});

		afterEach(function () {
			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			messages.length = 0;
			errors.length = 0;
		});

		it("receive domReady messages after setup, send init and resolves with method object", async function () {
			const initPlugin = createInitPlugin({ data, settings, hooks: hookFunction }, window, pluginIframe.contentWindow);
			createProvidePlugin({ hooks, methods }, pluginIframe.contentWindow, window);

			await initPlugin.then((obj) => {
				expect(!!obj.methods.updateData).toBe(true);
				expect(!!obj.methods.updateSettings).toBe(true);
			});
		});

		it("can call the methods from initPlugin", async function () {
			const initPlugin = createInitPlugin({ data, settings, hooks: hookFunction }, window, pluginIframe.contentWindow);
			await createProvidePlugin({ hooks, methods }, pluginIframe.contentWindow, window);

			await initPlugin.then((obj) => {
				obj.methods.updateData({ title: "New title", description: "New description" });
			});

			await new Promise(resolve => setTimeout(resolve, 0));
			expect(data.title).toStrictEqual("New title");
			expect(data.description).toStrictEqual("New description");
		});

		it("console.warn for unsupported hooks", async function () {
			createInitPlugin({ data, settings, hooks: { "extra-hook": null, ...hookFunction } }, window, pluginIframe.contentWindow);
			await createProvidePlugin({ hooks, methods }, pluginIframe.contentWindow, window);

			await new Promise(resolve => setTimeout(resolve, 0));
			expect(warnings).toHaveLength(1);
		});

		it("can call hook from providePlugin", async function () {
			createInitPlugin({ data, settings, hooks: { "extra-hook": null, ...hookFunction } }, window, pluginIframe.contentWindow);
			const providePlugin = await createProvidePlugin({ hooks, methods }, pluginIframe.contentWindow, window);
			await providePlugin.hooks.onResetButtonClicked("data");

			expect(messages).toHaveLength(1);
		});
	});
});
