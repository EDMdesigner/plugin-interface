import PostMessageSocket from "./postMessageSocket";

export default function createProvidePlugin({ hooks = [], methods = {}, validate = null }, currentWindow = window, targetWindow = window.parent) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	const providedHooks = hooks;

	Object.keys(methods).forEach((methodName) => {
		messageSocket.addListener(methodName, payload => methods[methodName](payload));
	});

	return new Promise((resolve) => {
		function sendDomReady() {
			messageSocket.sendMessage("domReady", {});
		}

		messageSocket.addListener("init", onInit, { once: true });

		if (messageSocket.getDocument().readyState === "loading") {
			messageSocket.getDocument().addEventListener("DOMContentLoaded", sendDomReady, { once: true });
		} else {
			sendDomReady();
		}

		// eslint-disable-next-line no-shadow
		function onInit({ data = null, settings = null, hooks = [] } = {}) {
			if (typeof validate === "function") {
				validate({ data, settings, hooks });
			}

			const hookFunctions = {};

			hooks.forEach((hook) => {
				if (!providedHooks.includes(hook)) {
					return console.warn(`The following hook is not valid: ${hook}`);
				}
				hookFunctions[hook] = async (payload) => {
					return await messageSocket.sendRequest(hook, payload);
				};
			});

			resolve({
				data,
				settings,
				hooks: hookFunctions,
			});
		}
	});
}
