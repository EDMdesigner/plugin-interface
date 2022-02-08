import PostMessageSocket from "../../src/postMessageSocket";
import providePlugin from "../../src/providePlugin";
import { addFixEvents, removeFixEvents } from "./testUtils/fixEvents";
import { sideEffectsMapper, createEventListenerSpy, resetJSDOM } from "./testUtils/jsdomReset";

describe("provide plugin tests", function () {
	const warnings = [];
	console.warn = payload => warnings.push(payload);
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
			warnings.length = 0;
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

		it("send domReady postmessage and receive an init message, after waiting for loading", async function () {
			windowSocket.addListener("domReady", (payload) => {
				messages.push(payload);
				windowSocket.sendMessage("init");
			}, { once: true });

			Object.defineProperty(pluginIframe.contentWindow.document, "readyState", {
				get() {
					return "loading";
				},
			});

			setTimeout(() => {
				pluginIframe.contentWindow.document.dispatchEvent(new Event("DOMContentLoaded", {
					bubbles: true,
					cancelable: true,
				}));
			}, 500);

			const plugin = await providePlugin({}, pluginIframe.contentWindow, window);

			expect(plugin.data).toBe(null);
			expect(!!plugin.hooks).toBe(true);
			expect(plugin.settings).toBe(null);
			expect(messages).toHaveLength(1);
		});

		it("no error message if all hooks set in the init message", async function () {
			const hooksFn = {};
			hooks.forEach((hook) => {
				hooksFn[hook] = (data) => {
					return new Promise((resolve) => {
						resolve(data);
					});
				};
			});
			windowSocket.addListener("domReady", () => {
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
			const providedHooks = hooks;
			windowSocket.addListener("domReady", () => {
				windowSocket.sendMessage("init", {
					data: "Data from init",
					settings: { test: true },
					hooks: [ "onClose" ],
				});
			}, { once: true });
			const requiredHooks = [];

			// eslint-disable-next-line no-shadow
			function validator({ hooks }) {
				providedHooks.forEach((hook) => {
					if (!hooks.includes(hook)) {
						requiredHooks.push(hook);
					}
				});
				if (requiredHooks.length) {
					throw new Error(`The following hooks are missing: ${requiredHooks}`);
				}
			}
			const error = new Error("The following hooks are missing: onResetButtonClicked,onSaveButtonClicked");

			await expect(providePlugin({
				settings: { isButtonClickable: true },
				hooks,
				methods: {
					test() {
						return "test";
					},
				},
				validator,
			}, pluginIframe.contentWindow, window)).rejects.toStrictEqual(error);
		});

		it("send a warning if finds an unknown hook", async function () {
			windowSocket.addListener("domReady", () => {
				windowSocket.sendMessage("init", {
					data: "Data from init",
					settings: { test: true },
					hooks: ["some-other-hook", ...hooks],
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
			expect(warnings).toHaveLength(1);
		});

		it("can call the hooks methods", async function () {
			windowSocket.addListener("domReady", () => {
				const hooksFn = {};
				hooks.forEach((hook) => {
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
	});
});
