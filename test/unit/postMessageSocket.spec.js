import PostMessageSocket from "../../src/postMessageSocket"


describe("postMessageSocket",() => {
	let pluginIframe;
	let messages = [];
	let windowSocket;
	let iframeSocket;

	// function saveMessage(event) {
	// 	console.log(event);
	// 	messages.push(event);
	// };

	beforeEach(() => {

		window.innerHTML = "";
		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		const body = document.querySelector("body");
		body.appendChild(pluginIframe);
		
		windowSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		// window.addEventListener("message", () => console.log("msg ARRIVED to window"))

		iframeSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
		// pluginIframe.contentWindow.addEventListener("message", () => console.log("msg ARRIVED to Iframe"))

	});
	
	it("can add listeners to the Sockets", () => {
		const cb = (event) => console.log(event);

		iframeSocket.addListener("test", cb, {once: true});
		windowSocket.addListener("test", cb, {once: true});

		expect(!!windowSocket.listeners.test).toBe(true);
		expect(!!iframeSocket.listeners.test).toBe(true);


		windowSocket.send("test", "hello world");
		iframeSocket.send("test", "hello world");


	});
	
});
