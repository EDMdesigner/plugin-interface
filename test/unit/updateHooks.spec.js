import providePlugin from "../../src/providePlugin";
import initPlugin from "../../src/initPlugin";
import { addFixEvents, removeFixEvents } from "./testUtils/fixEvents";
import { sideEffectsMapper, createEventListenerSpy } from "./testUtils/jsdomReset";

describe("updateHooks tests", function () {
	const warnings = [];
	const errors = [];
	const messages = [];
	let pluginIframe;
	let activeHooks;
	let pluginInterface;
	let plugin;
	let body;

	const defaultHookFunctions = {};
	const newHookFunctions = {};
	const newResetHookFunctions = {};
	const newRemoveHookFunctions = {};

	const defaultHooks = ["onResetButtonClicked", "onSaveButtonClicked", "onClose", "error"];
	defaultHooks.forEach((key) => {
		defaultHookFunctions[key] = (payload) => {
			messages.push(payload);
			return payload + "answer";
		};
	});
	const newHook = [ "onSave" ];
	newHook.forEach((key) => {
		newHookFunctions[key] = (payload) => {
			messages.push(payload);
			return payload + "answer";
		};
	});
	const newRemoveHook = [ "onClose" ];
	newRemoveHook.forEach((key) => {
		newRemoveHookFunctions[key] = null;
	});
	const newResetHooks = ["onSave", "error", "onFail"];
	newResetHooks.forEach((key) => {
		newResetHookFunctions[key] = (payload) => {
			messages.push(payload);
			return payload + "answer";
		};
	});

	console.warn = payload => warnings.push(payload);
	const sideEffects = sideEffectsMapper(window, document);

	beforeAll(() => {
		createEventListenerSpy(sideEffects);
		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		body = document.querySelector("body");
		body.appendChild(pluginIframe);
		addFixEvents(window, pluginIframe.contentWindow);
		addFixEvents(pluginIframe.contentWindow, window);
	});

	afterAll(async () => {
		await plugin.terminate();
		removeFixEvents(window);
		removeFixEvents(pluginIframe.contentWindow);
	});

	describe("updateHooks", () => {
		afterEach(function () {
			messages.length = 0;
			errors.length = 0;
			warnings.length = 0;
		});

		it("can set up the interface connection normally", async function () {
			const pluginInterfacePromise = initPlugin(
				{ data: {}, settings: {}, hooks: defaultHookFunctions },
				{ currentWindow: window, targetWindow: pluginIframe.contentWindow },
			);

			const pluginPromise = providePlugin({
				hooks: [...defaultHooks, ...newResetHooks],
				methods: {
					updateHooks(hooks) {
						activeHooks = hooks;
					},
				},
			}, pluginIframe.contentWindow, window);

			const [obj1, obj2] = await Promise.all([pluginInterfacePromise, pluginPromise]);

			pluginInterface = obj1;
			plugin = obj2;
			activeHooks = plugin.hooks;

			expect(!!obj1.methods.updateHooks).toBe(true);
			expect(Object.keys(activeHooks)).toStrictEqual(defaultHooks);
		});

		it("validate hooks that were set up on init", async function () {
			await activeHooks.onResetButtonClicked("test");
			await activeHooks.onSaveButtonClicked("test");
			await activeHooks.onClose("test");

			expect(messages).toHaveLength(3);
		});

		it("can update the hooks while keeping the already defined ones", async function () {
			await pluginInterface.methods.updateHooks({ hooks: newHookFunctions });

			await activeHooks.onResetButtonClicked("test");
			await activeHooks.onSaveButtonClicked("test");
			await activeHooks.onClose("test");
			await activeHooks.onSave("test");

			expect(messages).toHaveLength(4);

			expect(Object.keys(activeHooks)).toStrictEqual([...defaultHooks, ...newHook]);
		});

		it("can remove a hook if it's set to null", async function () {
			await pluginInterface.methods.updateHooks({ hooks: newRemoveHookFunctions });

			await activeHooks.onResetButtonClicked("test");
			await activeHooks.onSaveButtonClicked("test");
			await activeHooks.onSave("test");

			expect(messages).toHaveLength(3);

			expect(Object.keys(activeHooks)).toStrictEqual([...defaultHooks.filter(val => val !== "onClose"), ...newHook]);
		});

		it("can update the hooks without keeping the already defined ones", async function () {
			await pluginInterface.methods.updateHooks({ hooks: newResetHookFunctions, resetHooks: true });

			await activeHooks.onSave("test");
			await activeHooks.onFail("test");

			expect(messages).toHaveLength(2);

			expect(Object.keys(activeHooks)).toStrictEqual([ ...newResetHooks ]);
		});
	});
});
