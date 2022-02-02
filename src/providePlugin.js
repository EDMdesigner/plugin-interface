/* eslint-disable require-await */
/* eslint-disable no-shadow */
import PostMessageSocket from "./postMessageSocket.js";

export default function providePlugin({ settings = {}, hookNames = [], methods = {} }, _socket = null) {
	let socket = _socket;
	if (!socket) {
		socket = new PostMessageSocket(window, window.parent);
	}

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

	return new Promise((resolve) => {
		// eslint-disable-next-line require-await
		socket.addListener("init", onInit, { once: true });
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", sendDomReady);
		} else {
			sendDomReady();
		}

		async function onInit(config) {
			function listenForRequests() {
				Object.keys(methods).forEach((methodName) => {
					socket.addListener(methodName, payload => methods[methodName](payload));
				});
			}

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
		}
	});
}
