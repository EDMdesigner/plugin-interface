import PostMessageSocket from "./postMessageSocket.js";

// function validateConfig({ settings, hooks }, config) {
// 	// settings validation is quite hard, we would need a full-fledged json/object-tree validation
// }

export default function initPlugin({ container, src, data = {}, settings = {}, hooks = {} }, { timeout = 5000, beforeInit } = {}) {
	const pluginIframe = document.createElement("iframe");
	pluginIframe.src = src;
	pluginIframe.allowFullscreen = "allowfullscreen";

	if (typeof beforeInit === "function") {
		beforeInit({ container, iframe: pluginIframe });
	}

	container.appendChild(pluginIframe);

	const socket = new PostMessageSocket(window, pluginIframe.contentWindow);
	window.initSocket = socket;

	return new Promise((resolve) => {
		socket.addListener("domReady", onDomReady, { once: true });

		async function onDomReady(payload) {
			// validateConfig({ settings, hooks }, payload.config);
			await socket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) }, { timeout });
			listenForRequests();

			const methodNames = payload.config.methods;

			const methods = methodNames.reduce((method, methodName) => {
				return {
					...method,
					// eslint-disable-next-line require-await
					[methodName]: async (p) => {
						if (!methodNames.includes(methodName)) {
							throw new Error(`Naughty boy! Don't request ${"type"}!`);
						}

						return socket.sendRequest(methodName, p);
					},
				};
			}, {});

			// eslint-disable-next-line require-await
			async function listenForRequests() {
				Object.keys(hooks).forEach((hookName) => {
					socket.addListener(hookName, p => hooks[hookName](p));
				});
			}

			resolve({
				_container: container,
				_iframe: pluginIframe,
				methods,
			});
		}
	});
}
