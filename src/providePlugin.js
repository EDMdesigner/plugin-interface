import PostMessageSocket from "./postMessageSocket.js";

export default function providePlugin({ settings = {}, hooks = [], methods = {} }, _socket = null) {
	return new Promise((resolve) => {
		let socket = _socket;
		if (!socket) {
			socket = new PostMessageSocket(window, window.parent);
		}

		socket.addListener("init", onInit, { once: true });

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", sendDomReady);
		} else {
			sendDomReady();
		}

		async function sendDomReady() {
			// await new Promise(resolve => setTimeout(resolve, 500));

			socket.sendMessage("domReady", {
				config: {
					settings,
					hooks,
					methods: Object.keys(methods),
				},
			});

			document.removeEventListener("DOMContentLoaded", sendDomReady);
		}

		async function onInit(config) {
			console.log("INSIDE INIIIIIIIIIIIT");

			listenForRequests();

			await new Promise(resolve => setTimeout(resolve, 500));

			const hookFunctions = hooks.reduce((hooks, hookName) => {
				return {
					...hooks,
					[hookName]: async (payload) => {
						if (!config.hooks.includes(hookName)) {
							throw new Error(`The following hook is not configured: ${hookName}`);
						}

						return socket.sendSignal(hookName, payload);
					},
				};
			}, {});

			resolve({
				data: config.data,
				settings: config.settings,
				hooks: hookFunctions,
			});
		}

		async function listenForRequests() {
			Object.keys(methods).forEach((methodName) => {
				socket.addListener(methodName, payload => methods[methodName](payload));
			});
		}
	});
}
