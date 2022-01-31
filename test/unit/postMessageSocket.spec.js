import PostMessageSocket from "../../src/postMessageSocket"

// workaround for https://github.com/jsdom/jsdom/issues/2745
// if no origin exists, replace it with the right targetWindow
function fixEvents(currentWindow, targetWindow, event) {	
	if (!event.origin ||event.origin === '' || event.origin === null) {
		event.stopImmediatePropagation();
		const eventWithOrigin = new MessageEvent('message', {
			data: event.data,
			origin: targetWindow,
			source: targetWindow
		});
		currentWindow.dispatchEvent(eventWithOrigin);
	}
}

let fixEventsBinded;
function addFixEvents(currentWindow, targetWindow) {
	fixEventsBinded = fixEvents.bind(null, currentWindow, targetWindow);
	currentWindow.addEventListener('message', fixEventsBinded);
}

function removeFixEvents(windowObject) {
	windowObject.removeEventListener('message', fixEventsBinded);
}

describe("postMessageSocket",() => {
	let pluginIframe;
	let messages = [];
	let windowSocket;
	let iframeSocket;
	let body;

	const messageCallback = (data) => messages.push(data);

	const testWindowSocketOnce = "testWindowSocketOnce";
	const testiframeSocketSocketOnce = "testiframeSocketSocketOnce"
	const testWindowSocket = "testWindowSocket";
	const testiframeSocketSocket = "testiframeSocketSocket"
	const messageOne = "This is the first message";
	const messageTwo = "This is the second message";

	beforeAll(function () {
		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		body = document.querySelector("body");
		body.appendChild(pluginIframe);

		windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
		addFixEvents(window, pluginIframe.contentWindow)

		iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		addFixEvents(pluginIframe.contentWindow, window)
	});

	
	it("can create PostMessage sockets on window and Iframe.contentWindow", function () {
		expect(windowSocket.currentWindow).toBe(window);
		expect(windowSocket.targetWindow).toBe(pluginIframe.contentWindow);
		expect(typeof windowSocket.socketId).toBe("string");		
		expect(iframeSocket.currentWindow).toBe(pluginIframe.contentWindow);
		expect(iframeSocket.targetWindow).toBe(window);
		expect(typeof iframeSocket.socketId).toBe("string");
	})

	it("can add eventlisteners to sockets", function() {
		expect(!!windowSocket.listeners.testWindowSocketOnce).toBe(false);
		expect(!!iframeSocket.listeners.testiframeSocketSocketOnce).toBe(false);

		windowSocket.addListener(testWindowSocketOnce, messageCallback, {once: true});
		iframeSocket.addListener(testiframeSocketSocketOnce, messageCallback, {once: true});
		
		expect(!!windowSocket.listeners.testWindowSocketOnce).toBe(true);
		expect(!!iframeSocket.listeners.testiframeSocketSocketOnce).toBe(true);
	})
	
	it("can sendMessage to partner trough the socket", async function() {
		windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
		iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);		
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(messages.length).toBe(2);
		expect(messages[0]).toBe(messageOne);
		expect(messages[1]).toBe(messageTwo);

	});

	it("the eventlistener set up with parameter once is deleted after a message", function() {
		expect(!!windowSocket.listeners.testWindowSocketOnce).toBe(false);
		expect(!!iframeSocket.listeners.testiframeSocketSocketOnce).toBe(false);
	})


	it("can add permanent eventlisteners to sockets", function() {
		expect(!!windowSocket.listeners.testWindowSocket).toBe(false);
		expect(!!iframeSocket.listeners.testiframeSocketSocket).toBe(false);

		windowSocket.addListener(testWindowSocket, messageCallback);
		iframeSocket.addListener(testiframeSocketSocket, messageCallback);
		
		expect(!!windowSocket.listeners.testWindowSocket).toBe(true);
		expect(!!iframeSocket.listeners.testiframeSocketSocket).toBe(true);
	})

	it("can sendSignal to partner trough the socket", async function() {
		windowSocket.sendSignal(testiframeSocketSocket, messageOne);
		iframeSocket.sendSignal(testWindowSocket, messageTwo);		
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(messages.length).toBe(4);
		expect(messages[2]).toBe(messageOne);
		expect(messages[3]).toBe(messageTwo);
	});

	it("the eventlistener set up with parameter witout once is NOT deleted after a message", function() {
		expect(!!windowSocket.listeners.testWindowSocket).toBe(true);
		expect(!!iframeSocket.listeners.testiframeSocketSocket).toBe(true);
	})

	it.todo("can set up hook");

	it("with a NOT matching message type the callback is not fired", async function() {
		windowSocket.sendSignal("wrong msg type", messageOne);
		iframeSocket.sendSignal("wrong msg type", messageTwo);

		await new Promise(resolve => setTimeout(resolve, 100));
		expect(messages.length).toBe(4);
	})

	it("other windowObjects cant send msg", async function() {
		removeFixEvents(window);
		removeFixEvents(pluginIframe.contentWindow);
		addFixEvents(window, window);
		addFixEvents(pluginIframe.contentWindow, pluginIframe.contentWindow);

		// window.postMessage(JSON.stringify({ type: testWindowSocket, payload: messageOne, msgId: "testMsg" }), "*");
		pluginIframe.contentWindow.postMessage(JSON.stringify({type: testiframeSocketSocket, payload: messageOne, msgId: "testMsg"}), "*");
		await new Promise(resolve => setTimeout(resolve, 100));
		expect(messages.length).toBe(4);

		removeFixEvents(window);
		removeFixEvents(pluginIframe.contentWindow);
		addFixEvents(window, pluginIframe.contentWindow);
		addFixEvents(pluginIframe.contentWindow, window);
	})
	
});
