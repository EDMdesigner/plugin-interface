// import "regenerator-runtime/runtime";
// import JSDOM from "jsdom";
// const jsdom = require("jsdom");
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

const sideEffects = {
	document: {
		addEventListener: {
			fn: document.addEventListener,
			refs: [],
		},
		keys: Object.keys(document),
	},
	window: {
		addEventListener: {
			fn: window.addEventListener,
			refs: [],
		},
		keys: Object.keys(window),
	},
};

// Lifecycle Hooks
// -----------------------------------------------------------------------------
beforeAll(() => {
	// Spy addEventListener
	["document", "window"].forEach((obj) => {
		const fn = sideEffects[obj].addEventListener.fn;
		const refs = sideEffects[obj].addEventListener.refs;

		function addEventListenerSpy(type, listener, options) {
			// Store listener reference so it can be removed during reset
			refs.push({ type, listener, options });
			// Call original window.addEventListener
			fn(type, listener, options);
		}

		// Add to default key array to prevent removal during reset
		sideEffects[obj].keys.push("addEventListener");

		// Replace addEventListener with mock
		global[obj].addEventListener = addEventListenerSpy;
	});
});

// Reset JSDOM. This attempts to remove side effects from tests, however it does
// not reset all changes made to globals like the window and document
// objects. Tests requiring a full JSDOM reset should be stored in separate
// files, which is only way to do a complete JSDOM reset with Jest.
beforeEach(() => {
	const rootElm = document.documentElement;

	// Remove attributes on root element
	[ ...rootElm.attributes ].forEach(attr => rootElm.removeAttribute(attr.name));

	// Remove elements (faster than setting innerHTML)
	while (rootElm.firstChild) {
		rootElm.removeChild(rootElm.firstChild);
	}

	// Remove global listeners and keys
	["document", "window"].forEach((obj) => {
		const refs = sideEffects[obj].addEventListener.refs;

		// Listeners
		while (refs.length) {
			const { type, listener, options } = refs.pop();
			global[obj].removeEventListener(type, listener, options);
		}

		// Keys
		Object.keys(global[obj])
			.filter(key => !sideEffects[obj].keys.includes(key))
			.forEach((key) => {
				delete global[obj][key];
			});
	});

	// Restore base elements
	rootElm.innerHTML = "<head></head><body></body>";
});
describe("providePlugin", () => {
	let pluginIframe;
	let body;
	let windowSocket;
	let iframeSocket;

	beforeEach(function () {
		// jest.clearAllMocks();
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


		// // eslint-disable-next-line no-shadow
		// // const jsdom = require("jsdom");
		// const dom = new jsdom.JSDOM();
		// global.document = dom.window.document;
		// // eslint-disable-next-line no-global-assign
		// document = dom.window.document;
		// global.window = dom.window;
		// // eslint-disable-next-line no-global-assign
		// window = dom.window;

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
	fit("with missing hook method, throws error", async () => {
		windowSocket.addListener("domReady", onDomReady, { once: true });

		async function onDomReady(payload) {
			domReadyResponse = payload;
			await windowSocket.sendRequest("init", { data, settings, hooks: [] }, { timeout });
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
		expect(iface.hooks).toEqual({});
		console.log(iface);
	});
	// felszetupol hookot ami nincs
	it("with proper data, init properly", async () => {
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
});
