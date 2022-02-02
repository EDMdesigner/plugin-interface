import "regenerator-runtime/runtime";
// import JSDOM from "jsdom";
const jsdom = require("jsdom");
import PostMessageSocket from "../../src/postMessageSocket";
import providePlugin from "../../src/providePlugin";

// workaround for https://github.com/jsdom/jsdom/issues/2745
// if no origin exists, replace it with the right targetWindow
function fixEvents(currentWindow, targetWindow, event) {
	if (!event.origin || event.origin === "" || event.origin === null) {
		event.stopImmediatePropagation();
		const eventWithOrigin = new MessageEvent("message", {
			data: event.data,
			origin: targetWindow,
			source: targetWindow,
		});
		currentWindow.dispatchEvent(eventWithOrigin);
	}
}

let fixEventsBinded;
function addFixEvents(currentWindow, targetWindow) {
	fixEventsBinded = fixEvents.bind(null, currentWindow, targetWindow);
	currentWindow.addEventListener("message", fixEventsBinded);
}

// function removeFixEvents(windowObject) {
// 	windowObject.removeEventListener("message", fixEventsBinded);
// }

describe("providePlugin", () => {
	let pluginIframe;
	let body;
	let windowSocket;
	let iframeSocket;

	beforeEach(function () {
		jest.clearAllMocks();
		// // eslint-disable-next-line no-shadow
		// const jsdom = require("jsdom");
		// const { window } = new jsdom.JSDOM('<body></body>');

		// const dom = new JSDOM();
		// global.document = dom.window.document;
		// // eslint-disable-next-line no-global-assign
		// document = dom.window.document;
		// global.window = dom.window;
		// // eslint-disable-next-line no-global-assign
		// window = dom.window;


		// eslint-disable-next-line no-shadow
		// const jsdom = require("jsdom");
		const dom = new jsdom.JSDOM();
		global.document = dom.window.document;
		// eslint-disable-next-line no-global-assign
		document = dom.window.document;
		global.window = dom.window;
		// eslint-disable-next-line no-global-assign
		window = dom.window;

		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		body = document.querySelector("body");
		body.appendChild(pluginIframe);

		windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
		addFixEvents(window, pluginIframe.contentWindow);

		iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		addFixEvents(pluginIframe.contentWindow, window);
	});

	it.todo("throws proper errors on improper data");
	it.todo("with proper data, sends domready, throws error if not getting init call");
	const timeout = 5000;
	const hooks = {
		testHook: () => {
			console.log("testhook");
		},
	};
	const data = {
		title: "testTitle",
		description: "testDescription",
	};
	const settings = {
		background: "#abcdef",
	};
	function testMethod(testData) {
		console.log(testData);
	}
	let domReadyResponse;
	it("with missing hook method, throws error", async () => {
		windowSocket.addListener("domReady", onDomReady, { once: true });

		async function onDomReady(payload) {
			domReadyResponse = payload;
			await windowSocket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) }, { timeout });
		}
		const iface = await providePlugin({
			settings,
			hookNames: [ "testHook" ],
			methods: {
				testMethod,
			},
		}, iframeSocket);

		expect(domReadyResponse.config.settings).toEqual({ background: "#abcdef" });
		expect(domReadyResponse.config.hookNames).toEqual([ "testHook" ]);
		expect(domReadyResponse.config.methods).toEqual([ "testMethod" ]);

		expect(iface.data).toEqual({ title: "testTitle", description: "testDescription" });
		expect(iface.settings).toEqual({ background: "#abcdef" });
		expect(typeof iface.hooks.testHook).toBe("function");
	});
	// felszetupol hookot ami nincs
	it("with proper data, init properly", async () => {
		windowSocket.addListener("domReady", onDomReady, { once: true });

		async function onDomReady(payload) {
			console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
			domReadyResponse = payload;
			await windowSocket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) }, { timeout });
		}
		const iface = await providePlugin({
			settings,
			hookNames: [ "testHook" ],
			methods: {
				testMethod,
			},
		}, iframeSocket);

		expect(domReadyResponse.config.settings).toEqual({ background: "#abcdef" });
		expect(domReadyResponse.config.hookNames).toEqual([ "testHook" ]);
		expect(domReadyResponse.config.methods).toEqual([ "testMethod" ]);

		expect(iface.data).toEqual({ title: "testTitle", description: "testDescription" });
		expect(iface.settings).toEqual({ background: "#abcdef" });
		expect(typeof iface.hooks.testHook).toBe("function");
	});
});
