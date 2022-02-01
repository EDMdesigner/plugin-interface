import PostMessageSocket from "../../src/postMessageSocket";

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

function removeFixEvents(windowObject) {
	windowObject.removeEventListener("message", fixEventsBinded);
}

describe("set up postMessageSocket environments", () => {
	let pluginIframe;
	const messages = [];
	let windowSocket;
	let iframeSocket;
	let body;

	const messageCallback = data => messages.push(data);

	const testWindowSocketOnce = "testWindowSocketOnce";
	const testiframeSocketSocketOnce = "testiframeSocketSocketOnce";
	const testWindowSocket = "testWindowSocket";
	const testiframeSocketSocket = "testiframeSocketSocket";
	const messageOne = "This is the first message";
	const messageTwo = "This is the second message";

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

	describe("postMessageSocket tests", function () {
		beforeEach(function () {
			pluginIframe = document.createElement("iframe");
			pluginIframe.src = "";
			pluginIframe.allowFullscreen = "allowfullscreen";
			body = document.querySelector("body");
			body.appendChild(pluginIframe);

			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
			windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
			iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		});
		afterEach(async function () {
			windowSocket.terminate();
			await new Promise(resolve => setTimeout(resolve, 100));
			windowSocket = null;
			iframeSocket.terminate();
			await new Promise(resolve => setTimeout(resolve, 100));
			iframeSocket = null;
			messages.length = 0;
		});

		it("can sendMessage to partner after the right listener set up which is DELETED afterwards", async function () {
			windowSocket.addListener(testWindowSocketOnce, messageCallback, { once: true });
			iframeSocket.addListener(testiframeSocketSocketOnce, messageCallback, { once: true });

			windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
			iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 100));

			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(messageOne);
			expect(messages[1]).toBe(messageTwo);

			windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
			iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 100));

			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(messageOne);
			expect(messages[1]).toBe(messageTwo);
		});

		it("can sendRequest to partner after the right listener set up which is NOT DELETED afterwards", async function () {
			windowSocket.addListener(testWindowSocket, messageCallback);
			iframeSocket.addListener(testiframeSocketSocket, messageCallback);

			windowSocket.sendRequest(testiframeSocketSocket, messageOne);
			iframeSocket.sendRequest(testWindowSocket, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 100));

			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(messageOne);
			expect(messages[1]).toBe(messageTwo);

			windowSocket.sendRequest(testiframeSocketSocket, messageOne);
			iframeSocket.sendRequest(testWindowSocket, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 100));

			expect(messages).toHaveLength(4);
			expect(messages[2]).toBe(messageOne);
			expect(messages[3]).toBe(messageTwo);
		});

		it("can send request and get answer from the opposite window object", async function () {
			windowSocket.addListener("hook", (data) => {
				return data + " from the other side.";
			});
			const answer = await iframeSocket.sendRequest("hook", "hello world");

			expect(answer).toBe("hello world" + " from the other side.");

			iframeSocket.addListener("hook", (data) => {
				return data + " from this side.";
			});
			const answer2 = await windowSocket.sendRequest("hook", "hello world");

			expect(answer2).toBe("hello world" + " from this side.");
		});

		it("with a NOT matching type the callback is not fired", async function () {
			windowSocket.addListener(testWindowSocket, messageCallback);
			iframeSocket.addListener(testiframeSocketSocket, messageCallback);

			windowSocket.sendMessage("random-type", messageOne);
			iframeSocket.sendMessage("random-type", messageTwo);

			windowSocket.sendRequest("random-type", messageOne);
			iframeSocket.sendRequest("random-type", messageTwo);

			await new Promise(resolve => setTimeout(resolve, 100));
			expect(messages).toHaveLength(0);
		});

		it("other windowObjects can not send msg", async function () {
			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			addFixEvents(window, window);
			addFixEvents(pluginIframe.contentWindow, pluginIframe.contentWindow);

			// window.postMessage(JSON.stringify({ type: testWindowSocket, payload: messageOne, msgId: "testMsg" }), "*");
			pluginIframe.contentWindow.postMessage(JSON.stringify({ type: testiframeSocketSocket, payload: messageOne, msgId: "testMsg" }), "*");

			await new Promise(resolve => setTimeout(resolve, 100));
			expect(messages).toHaveLength(0);

			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
		});

		it.todo("return error from hooks");

		it("test terminate", async function () {
			windowSocket.terminate();

			await new Promise(resolve => setTimeout(resolve, 100));

			windowSocket.addListener(testWindowSocketOnce, messageCallback, { once: true });
			iframeSocket.addListener(testiframeSocketSocketOnce, messageCallback, { once: true });

			windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
			iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 100));

			expect(messages).toHaveLength(0);
		});
	});
});
