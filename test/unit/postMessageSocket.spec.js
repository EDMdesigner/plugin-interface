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

describe("postMessageSocket", () => {
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

	beforeAll(function () {
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

	it("can sendMessage to partner trough the socket", async function () {
		windowSocket.addListener(testWindowSocketOnce, messageCallback, { once: true });
		iframeSocket.addListener(testiframeSocketSocketOnce, messageCallback, { once: true });

		windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
		iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(messages).toHaveLength(2);
		expect(messages[0]).toBe(messageOne);
		expect(messages[1]).toBe(messageTwo);
	});

	it("the eventlistener set up with parameter once is deleted after a message", async function () {
		windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
		iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(messages).toHaveLength(2);
		expect(messages[0]).toBe(messageOne);
		expect(messages[1]).toBe(messageTwo);
	});

	it("can sendRequest to partner trough the socket", async function () {
		windowSocket.addListener(testWindowSocket, messageCallback);
		iframeSocket.addListener(testiframeSocketSocket, messageCallback);

		windowSocket.sendRequest(testiframeSocketSocket, messageOne);
		iframeSocket.sendRequest(testWindowSocket, messageTwo);
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(messages).toHaveLength(4);
		expect(messages[2]).toBe(messageOne);
		expect(messages[3]).toBe(messageTwo);
	});

	it("the eventlistener set up with parameter without once is NOT deleted after a message", async function () {
		windowSocket.sendRequest(testiframeSocketSocket, messageOne);
		iframeSocket.sendRequest(testWindowSocket, messageTwo);
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(messages).toHaveLength(6);
		expect(messages[4]).toBe(messageOne);
		expect(messages[5]).toBe(messageTwo);
	});

	it.todo("can set up hook");

	it("with a NOT matching message type the callback is not fired", async function () {
		windowSocket.sendRequest("wrong msg type", messageOne);
		iframeSocket.sendRequest("wrong msg type", messageTwo);

		await new Promise(resolve => setTimeout(resolve, 100));
		expect(messages).toHaveLength(6);
	});

	it("other windowObjects can not send msg", async function () {
		removeFixEvents(window);
		removeFixEvents(pluginIframe.contentWindow);
		addFixEvents(window, window);
		addFixEvents(pluginIframe.contentWindow, pluginIframe.contentWindow);

		// window.postMessage(JSON.stringify({ type: testWindowSocket, payload: messageOne, msgId: "testMsg" }), "*");
		pluginIframe.contentWindow.postMessage(JSON.stringify({ type: testiframeSocketSocket, payload: messageOne, msgId: "testMsg" }), "*");
		await new Promise(resolve => setTimeout(resolve, 100));
		expect(messages).toHaveLength(6);

		removeFixEvents(window);
		removeFixEvents(pluginIframe.contentWindow);
		addFixEvents(window, pluginIframe.contentWindow);
		addFixEvents(pluginIframe.contentWindow, window);
	});
});
