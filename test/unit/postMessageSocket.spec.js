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

	beforeEach(() => {
		window.innerHTML = "";
		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		const body = document.querySelector("body");
		body.appendChild(pluginIframe);

		windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
		fixEvents(window, pluginIframe.contentWindow)

		iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		fixEvents(pluginIframe.contentWindow, window)
	});

	
	
	it("can add listeners to the Sockets", async () => {

		expect(windowSocket.currentWindow).toBe(window);
		expect(iframeSocket.currentWindow).toBe(pluginIframe.contentWindow);

		const cb = (data) => messages.push(data);

		expect(!!windowSocket.listeners.test).toBe(false);
		expect(!!iframeSocket.listeners.test).toBe(false);

		windowSocket.addListener("test", cb, {once: true});
		iframeSocket.addListener("test", cb, {once: true});
		
		expect(!!windowSocket.listeners.test).toBe(true);
		expect(!!iframeSocket.listeners.test).toBe(true);


		windowSocket.send("test", "window socket sending");
		iframeSocket.send("test", "iframeSocket socket sending");
		
		// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
		await new Promise(resolve => setTimeout(resolve, 100));
		

		expect(!!iframeSocket.listeners.test).toBe(false);
		expect(!!windowSocket.listeners.test).toBe(false);
		
		expect(messages.length).toBe(2);

		expect(!!iframeSocket.listeners.test).toBe(false);
		expect(!!windowSocket.listeners.test).toBe(false);

	});
	
});
