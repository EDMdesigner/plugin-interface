import PostMessageSocket from "./postMessageSocket.js";

export function createInitPlugin({ data, settings, hooks }, { container, src, beforeInit, timeout }) {
	const pluginIframe = document.createElement("iframe");
	pluginIframe.src = src;
	pluginIframe.allowFullscreen = "allowfullscreen";
	pluginIframe.style.width = "100%";
	pluginIframe.style.height = "100%";

	if (typeof beforeInit === "function") {
		beforeInit({ container, iframe: pluginIframe });
	}

	container.appendChild(pluginIframe);

	return initPlugin({ data, settings, hooks }, window, pluginIframe.contentWindow, timeout);
}

export default function initPlugin({ data, settings, hooks }, currentWindow, targetWindow, timeout = 5000) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	messageSocket.addListener("error", payload => console.warn(payload));

	Object.keys(hooks).forEach((hook) => {
		messageSocket.addListener(hook, payload => hooks[hook](payload));
	});

	return new Promise((resolve, reject) => {
		messageSocket.addListener("domReady", onDomReady, { once: true });

		const timeoutError = new Error("Plugin initialization failed");
		setTimeout(reject(timeoutError), timeout);

		async function onDomReady() {
			const answer = await messageSocket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) });
			const methods = {};

			answer.forEach((type) => {
				methods[type] = async (payload) => {
					return await messageSocket.sendRequest(type, payload);
				};
			});

			resolve({
				methods,
				terminate: messageSocket.terminate,
			});
		}
	});
}
