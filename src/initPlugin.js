import PostMessageSocket from "./postMessageSocket.js";

export default function createInitPlugin({ data, settings, hooks }, { container, src }, beforeInit) {
	// eslint-disable-next-line no-shadow
	function createPluginIframe({ container, src }, beforeInit) {
		const pluginIframe = document.createElement("iframe");
		pluginIframe.src = src;
		pluginIframe.allowFullscreen = "allowfullscreen";

		if (typeof beforeInit === "function") {
			beforeInit({ container, iframe: pluginIframe });
		}
		container.appendChild(pluginIframe);

		return pluginIframe;
	}
	const pluginIframe = createPluginIframe({ container, src }, beforeInit);

	const messageSocket = new PostMessageSocket(window, pluginIframe.contentWindow);

	messageSocket.addListener("error", payload => console.warn(payload));

	Object.keys(hooks).forEach((hook) => {
		messageSocket.addListener(hook, payload => hooks[hook](payload));
	});

	return new Promise((resolve) => {
		messageSocket.addListener("domReady", onDomReady, { once: true });
		async function onDomReady() {
			const answer = await messageSocket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) });
			const methods = {};

			answer.forEach((type) => {
				methods[type] = async (payload) => {
					return await messageSocket.sendRequest(type, payload);
				};
			});

			resolve({
				// _container: container,
				// _iframe: pluginIframe,
				methods,
			});
		}
	});
}
