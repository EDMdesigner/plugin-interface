import PostMessageSocket from "./postMessageSocket";

export default function createProvidePlugin({ hooks = [], methods = {} }, currentWindow = window, targetWindow = window.parent) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	const providedHooks = hooks;

	Object.keys(methods).forEach((methodName) => {
		messageSocket.addListener(methodName, payload => methods[methodName](payload));
	});

	return new Promise((resolve) => {
		function sendDomReady() {
			messageSocket.sendMessage("domReady", {
				config: {
					hooks,
					methods: Object.keys(methods),
				},
			});
		}

		messageSocket.addListener("init", onInit, { once: true });

		if (messageSocket.getDocument().readyState === "loading") {
			messageSocket.getDocument().addEventListener("DOMContentLoaded", sendDomReady, { once: true });
		} else {
			sendDomReady();
		}

		// eslint-disable-next-line no-shadow
		function onInit({ data = null, settings = null, hooks = [] } = {}) {
			const hookFunctions = {};

			hooks.forEach((hook) => {
				if (!providedHooks.includes(hook)) {
					messageSocket.sendMessage("error", `The following hook is not valid: ${hook}`);
					return;
				}
				hookFunctions[hook] = async (payload) => {
					return await messageSocket.sendRequest(hook, payload);
				};
			});

			providedHooks.forEach((hook) => {
				if (hookFunctions[hook]) return;
				messageSocket.sendMessage("error", `The following hook is not set up: ${hook}`);
			});

			resolve({
				data,
				settings,
				hooks: hookFunctions,
			});
		}
	});
}
