import PostMessageSocket from "./postMessageSocket.js";

export default function providePlugin({ settings = {}, hooks = [], methods = {} }, socket = null) {
	return new Promise((resolve) => {
		let _socket = socket;
		if (!socket) {
			_socket = new PostMessageSocket(window, window.parent);
		}

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", sendDomReady);
		} else {
			sendDomReady();
		}

		_socket.addListener("init", onInit, { once: true });

		// eslint-disable-next-line require-await
		async function sendDomReady() {
			// await new Promise(resolve => setTimeout(resolve, 500));

			_socket.sendMessage("domReady", {
				config: {
					settings,
					hooks,
					methods: Object.keys(methods),
				},
			});

			document.removeEventListener("DOMContentLoaded", sendDomReady);
		}

		async function onInit(config) {
			listenForRequests();

			// eslint-disable-next-line no-shadow
			await new Promise(resolve => setTimeout(resolve, 500));

			const hookFunctions = hooks.reduce((hook, hookName) => {
				return {
					...hook,
					// eslint-disable-next-line require-await
					[hookName]: async (payload) => {
						if (!config.hooks.includes(hookName)) {
							throw new Error(`The following hook is not configured: ${hookName}`);
						}

						return _socket.sendRequest(hookName, payload);
					},
				};
			}, {});

			resolve({
				data: config.data,
				settings: config.settings,
				hooks: hookFunctions,
			});
		}

		// eslint-disable-next-line require-await
		async function listenForRequests() {
			Object.keys(methods).forEach((methodName) => {
				_socket.addListener(methodName, payload => methods[methodName](payload));
			});
		}
	});
}
