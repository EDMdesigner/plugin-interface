import PostMessageSocket from "../../src/postMessageSocket"

// workaround for https://github.com/jsdom/jsdom/issues/2745
// if no origin exists, replace it with the targetwindow
function fixEvents(currentWindow, targetWindow) {
	currentWindow.addEventListener('message', (event) => {
		if (!event.origin ||event.origin === '' || event.origin === null) {
			event.stopImmediatePropagation();
			const eventWithOrigin = new MessageEvent('message', {
				data: event.data,
				origin: targetWindow,
				source: targetWindow
			});
			currentWindow.dispatchEvent(eventWithOrigin);
		}
	});
}

describe("postMessageSocket",() => {
	let pluginIframe;
	let messages = [];
	let windowSocket;
	let iframeSocket;
	let body;
	const messageCallback = (data) => messages.push(data);

	beforeAll(function () {
		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		body = document.querySelector("body");
		body.appendChild(pluginIframe);

		windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
		fixEvents(window, pluginIframe.contentWindow)

		iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		fixEvents(pluginIframe.contentWindow, window)
	});

	
	it("can create PostMessage sockets on window and Iframe.contentWindow", function () {
		expect(windowSocket.currentWindow).toBe(window);
		expect(windowSocket.targetWindow).toBe(pluginIframe.contentWindow);
		expect(typeof windowSocket.socketId).toBe("string");		
		expect(iframeSocket.currentWindow).toBe(pluginIframe.contentWindow);
		expect(iframeSocket.targetWindow).toBe(window);
		expect(typeof iframeSocket.socketId).toBe("string");
	})

	it("can add eventlisteners to the sockets", function() {
		expect(!!windowSocket.listeners.test).toBe(false);
		expect(!!iframeSocket.listeners.test).toBe(false);

		windowSocket.addListener("test", messageCallback, {once: true});
		iframeSocket.addListener("test", messageCallback, {once: true});
		
		expect(!!windowSocket.listeners.test).toBe(true);
		expect(!!iframeSocket.listeners.test).toBe(true);
	})
	
	it("can sendMessage to partner trough the socket", async function() {
		const messageOne = "This is the first message";
		const messageTwo = "This is the second message";

		windowSocket.sendMessage("test", messageOne);
		iframeSocket.sendMessage("test", messageTwo);		
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(!!iframeSocket.listeners.test).toBe(false);
		expect(!!windowSocket.listeners.test).toBe(false);		
		expect(messages.length).toBe(2);
		expect(messages[0]).toBe(messageOne);
		expect(messages[1]).toBe(messageTwo);

	});

	it("the eventlistener set up with parameter once is deleted after a message", function() {
		expect(!!iframeSocket.listeners.test).toBe(false);
		expect(!!windowSocket.listeners.test).toBe(false);
	})
	
});
