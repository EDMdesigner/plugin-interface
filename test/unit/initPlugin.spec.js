import PostMessageSocket from "../../src/postMessageSocket";
import InitPlugin from "../../src/initPlugin";
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

			const initPlugin = new InitPlugin();
			const providePlugin = new ProvidePlugin();
			windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
			windowSocket.addListener("error", payload => errors.push(payload));
			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
		});

		afterEach(async function () {
			await windowSocket.terminate();
			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			await new Promise(resolve => setTimeout(resolve, 100));
			await new Promise(resolve => setTimeout(resolve, 100));
			windowSocket = null;
			messages.length = 0;
			errors.length = 0;
		});

		it.todo("receive onDomrady msg frpm providePlugin");
	});
});
