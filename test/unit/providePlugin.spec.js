import PostMessageSocket from "../../src/postMessageSocket";
import providePlugin from "../../src/providePlugin";
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
		let windowSocket;
		const messages = [];
		const errors = [];

		const hooks = ["onResetButtonClicked", "onSaveButtonClicked", "onClose"];

		beforeEach(function () {
			pluginIframe = document.createElement("iframe");
			pluginIframe.src = "";
			pluginIframe.allowFullscreen = "allowfullscreen";
			body = document.querySelector("body");
			body.appendChild(pluginIframe);

			windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
			windowSocket.addListener("error", payload => errors.push(payload));
			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
		});

		afterEach(async function () {
			await windowSocket.terminate();
			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			windowSocket = null;
			messages.length = 0;
			errors.length = 0;
		});

		it("send domReady postmessage and receive an init message", async function () {
			windowSocket.addListener("domReady", (payload) => {
				messages.push(payload);
				windowSocket.sendMessage("init");
			}, { once: true });

			const plugin = await providePlugin({}, pluginIframe.contentWindow, window);

			expect(plugin.data).toBe(null);
			expect(!!plugin.hooks).toBe(true);
			expect(plugin.settings).toBe(null);

			expect(messages).toHaveLength(1);
		});

		it("no error message if all hooks set in the init message", async function () {
			windowSocket.addListener("domReady", (payload) => {
				const hooksFn = {};
				payload.config.hooks.forEach((hook) => {
					hooksFn[hook] = (data) => {
						return new Promise((resolve) => {
							resolve(data);
						});
					};
				});
				windowSocket.sendMessage("init", {
					data: "Data from init",
					settings: { test: true },
					hooks: Object.keys(hooksFn),
				});
			}, { once: true });

			const plugin = await providePlugin({
				data: "This is the data",
				settings: { isButtonClickable: true },
				hooks,
				methods: {
					test() {
						return "test";
					},
				},
			}, pluginIframe.contentWindow, window);

			expect(plugin.data).toBe("Data from init");
			expect(Object.keys(plugin.hooks)).toStrictEqual(hooks);
			expect(!!plugin.settings.test).toBe(true);
		});

		it("send an error message if some hooks are not set", async function () {
			windowSocket.addListener("error", (payload) => {
				errors.push(payload);
			});

			windowSocket.addListener("domReady", () => {
				windowSocket.sendMessage("init", {
					data: "Data from init",
					settings: { test: true },
					hooks: [],
				});
			}, { once: true });

			const plugin = providePlugin({
				data: "This is the data",
				settings: { isButtonClickable: true },
				hooks,
				methods: {
					test() {
						return "test";
					},
				},
			}, pluginIframe.contentWindow, window);

			expect(await plugin).toThrow();

			expect(plugin.data).toBe("Data from init");
			expect(!!plugin.settings.test).toBe(true);
			expect(Object.keys(plugin.hooks)).toStrictEqual([]);

			const expectedErrors = hooks.map((hook) => {
				return `The following hook is not set up: ${hook}`;
			});

			await new Promise(resolve => setTimeout(resolve, 0));

			expect(errors).toHaveLength(3);

			expect(errors.sort()).toStrictEqual(expectedErrors.sort());
		});

		it("send an error message if finds an unknown hook", async function () {
			windowSocket.addListener("error", (payload) => {
				errors.push(payload);
			});

			windowSocket.addListener("domReady", (payload) => {
				windowSocket.sendMessage("init", {
					data: "Data from init",
					settings: { test: true },
					hooks: ["some-other-hook", ...payload.config.hooks],
				});
			}, { once: true });

			const plugin = await providePlugin({
				data: "This is the data",
				settings: { isButtonClickable: true },
				hooks,
				methods: {
					test() {
						return "test";
					},
				},
			}, pluginIframe.contentWindow, window);

			expect(plugin.data).toBe("Data from init");
			expect(!!plugin.settings.test).toBe(true);

			expect(Object.keys(plugin.hooks)).toStrictEqual(hooks);

			await new Promise(resolve => setTimeout(resolve, 0));

			expect(errors.sort()).toStrictEqual([ "The following hook is not valid: some-other-hook" ].sort());
		});

		it("can call the hooks methods", async function () {
			windowSocket.addListener("domReady", (payload) => {
				const hooksFn = {};
				payload.config.hooks.forEach((hook) => {
					hooksFn[hook] = (data) => {
						return new Promise((resolve) => {
							resolve(data);
						});
					};
				});
				windowSocket.sendMessage("init", {
					data: "Data from init",
					settings: { test: true },
					hooks: Object.keys(hooksFn),
				});
			}, { once: true });

			const plugin = await providePlugin({
				data: "This is the data",
				settings: { isButtonClickable: true },
				hooks,
				methods: {
					test() {
						return "test";
					},
				},
			}, pluginIframe.contentWindow, window);

			windowSocket.addListener("onResetButtonClicked", (payload) => {
				messages.push(payload);
				return payload + "answer";
			});
			windowSocket.addListener("onSaveButtonClicked", (payload) => {
				messages.push(payload);
				return payload + "answer";
			});
			windowSocket.addListener("onClose", (payload) => {
				messages.push(payload);
				return payload + "answer";
			});

			await plugin.hooks.onResetButtonClicked("test");
			await plugin.hooks.onSaveButtonClicked("test");
			await plugin.hooks.onClose("test");

			expect(messages).toHaveLength(3);

			expect(plugin.data).toBe("Data from init");
			expect(Object.keys(plugin.hooks)).toStrictEqual(hooks);
			expect(!!plugin.settings.test).toBe(true);
		});

		it.todo("with proper data, sends domready, throws error if not getting init call");
	});
});
