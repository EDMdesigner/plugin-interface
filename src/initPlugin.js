import PostMessageSocket from "./postMessageSocket.js";
import initUpdateHooks from "./updateHooks.js";

export function createInitPlugin({ data, settings, hooks }, { container, src, beforeInit, timeout }) {
	const pluginIframe = document.createElement("iframe");

	pluginIframe.src = src;
	pluginIframe.allowFullscreen = "allowfullscreen";
	pluginIframe.style.width = "100%";
	pluginIframe.style.height = "100%";
	pluginIframe.style.border = "0";
	pluginIframe.style.margin = "0";
	pluginIframe.style.padding = "0";

	if (typeof beforeInit === "function") {
		beforeInit({ container, iframe: pluginIframe });
	}

	container.appendChild(pluginIframe);

	return initPlugin({ data, settings, hooks }, { currentWindow: window, targetWindow: pluginIframe.contentWindow, timeout, container });
}

export default function initPlugin({ data, settings, hooks }, { currentWindow, targetWindow, timeout = null, container }) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	const updateHooks = initUpdateHooks(messageSocket);
	updateHooks({ hooks });

	return new Promise((resolve, reject) => {
		messageSocket.addListener("domReady", onDomReady, { once: true });

		let timeoutId = null;

		if (timeout) {
			timeoutId = setTimeout(() => {
				messageSocket.terminate();
				if (container?.remove && typeof container.remove === "function") {
					container.remove();
				}
				reject(new Error(`Plugin initialization failed with timeout! You can try to increase the timeout value in the plugin settings. Current value is ${timeout}ms.`));
			}, timeout);
		}

		async function onDomReady() {
			const answer = await messageSocket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) });

			const methods = {};

			answer.forEach((type) => {
				methods[type] = async (payload) => {
					if (type === "updateHooks") {
						return await messageSocket.sendRequest(type, updateHooks(payload));
					}
					return await messageSocket.sendRequest(type, payload);
				};
			});

			clearTimeout(timeoutId);

			resolve({
				methods,
				terminate: messageSocket.terminate,
			});
		}
	});
}
