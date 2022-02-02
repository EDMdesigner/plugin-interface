/* eslint-disable require-await */
/* eslint-disable no-shadow */
import PostMessageSocket from "./postMessageSocket.js";

export default function providePlugin({ settings = {}, hookNames = [], methods = {} }, _socket = null) {
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

		// eslint-disable-next-line require-await
		async function sendDomReady() {
			// await new Promise(resolve => setTimeout(resolve, 500));

			socket.sendMessage("domReady", {
				config: {
					settings,
					hookNames,
					methods: Object.keys(methods),
				},
			});

			document.removeEventListener("DOMContentLoaded", sendDomReady);
		}

		async function onInit(config) {
			console.log(config);
			listenForRequests();

			// await new Promise(resolve => setTimeout(resolve, 500));

			const hookFunctions = hookNames.reduce((hooks, hookName) => {
				if (!config.hooks.includes(hookName)) {
					socket.sendMessage(`The following hook is not configured: ${hookName}`);
				}
				return {
					...hooks,
					[hookName]: async (payload) => {
						return socket.sendRequest(hookName, payload);
					},
				};
			}, {});

			resolve({
				data: config.data,
				settings: config.settings,
				hooks: hookFunctions,
			});

			return {
				data: config.data,
				settings: config.settings,
				hooks: hookFunctions,
			};
		}

		async function listenForRequests() {
			Object.keys(methods).forEach((methodName) => {
				socket.addListener(methodName, payload => methods[methodName](payload));
			});
		}
	});
}
