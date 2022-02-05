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
		const messages = [];
		const errors = [];

		const hooks = ["onResetButtonClicked", "onSaveButtonClicked", "onClose"];
		const hookFunction = {
			error: data => errors.push(data),
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

		it("receive domReady messages after setup, send init and resolves with the method object", async function () {
			const initPlugin = createInitPlugin({ data, settings, hooks: hookFunction }, window, pluginIframe.contentWindow);
			createProvidePlugin({ hooks, methods }, pluginIframe.contentWindow, window);

			await initPlugin.then((obj) => {
				expect(!!obj.methods.updateData).toBe(true);
				expect(!!obj.methods.updateSettings).toBe(true);
			});
		});

		it("creates error hookFunction when not provided", async function () {
			delete hookFunction.error;

			createInitPlugin({ data, settings, hooks: hookFunction }, window, pluginIframe.contentWindow);
			const providePlugin = createProvidePlugin({ hooks, methods }, pluginIframe.contentWindow, window);

			await providePlugin.then((obj) => {
				expect(!!obj.hooks.error).toBe(true);
			});
		});

		it.todo("can call the hookFunction from providePlugin");
	});
});
