import CreateIframeSocket from "./createContentWindowSocket.js";

export default function providePlugin({ settings = {}, hooks = [], methods = {} }) {
	return new Promise((resolve) => {
		const socket = new CreateIframeSocket(window, window.parent);

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", sendDomReady);
		} else {
			sendDomReady();
		}
		
		socket.addListener("init", onInit, { once: true });
		
		async function sendDomReady() {
			// await new Promise(resolve => setTimeout(resolve, 500));

			socket.send("domReady", {
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

			await new Promise(resolve => setTimeout(resolve, 500));

			const hookFunctions = hooks.reduce((hooks, hookName) => {
				return {
					...hooks,
					[hookName]: async (payload) => {
						if (!config.hooks.includes(hookName)) {
							throw new Error(`The following hook is not configured: ${hookName}`)
						}
	
						return socket.request(hookName, payload);
					}
				}
			}, {})

			resolve({
				data: config.data,
				settings: config.settings,
				hooks: hookFunctions
			});
		}

		async function listenForRequests() {
			Object.keys(methods).forEach((methodName) => {
				socket.addListener(methodName, payload => methods[methodName](payload));
			});
		}
	});
}
