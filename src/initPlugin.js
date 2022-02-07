import PostMessageSocket from "./postMessageSocket.js";

export default function createInitPlugin({ data, settings, hooks }, currentWindow, targetWindow) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	const initedHooks = hooks;

	Object.keys(hooks).forEach((hook) => {
		messageSocket.addListener(hook, payload => hooks[hook](payload));
	});

	return new Promise((resolve) => {
		messageSocket.addListener("domReady", onDomReady, { once: true });

		function onDomReady(payload) {
			messageSocket.sendMessage("init", { data, settings, hooks: Object.keys(initedHooks) });

			const methods = {};
			payload.config.methods.forEach((type) => {
				methods[type] = async () => {
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
