import PostMessageSocket from "./postMessageSocket";

export default function createProvidePlugin({ hooks = [], methods = {}, validator = null } = {}, currentWindow = window, targetWindow = window.parent) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	const providedHooks = hooks;
	if (!providedHooks.includes("error")) {
		providedHooks.push("error");
	}

	Object.keys(methods).forEach((methodName) => {
		messageSocket.addListener(methodName, payload => methods[methodName](payload));
	});

	function sendDomReady() {
		messageSocket.sendMessage("domReady", Object.keys(methods));
	}

	if (messageSocket.getDocument().readyState === "loading") {
		messageSocket.getDocument().addEventListener("DOMContentLoaded", sendDomReady, { once: true });
	} else {
		sendDomReady();
	}

	return new Promise((resolveProvidePlugin, rejectProvidePlugin) => {
		messageSocket.addListener("init", onInit, { once: true });

		// eslint-disable-next-line no-shadow
		function onInit({ data = null, settings = null, hooks = [] } = {}) {
			try {
				if (!hooks.includes("error")) {
					hooks.push("error");
				}
				if (typeof validator === "function") {
					validator({ data, settings, hooks });
				}
				const hookFunctions = {};

				hooks.forEach((hook) => {
					if (!providedHooks.includes(hook)) {
						return messageSocket.sendMessage("error", `The following hook is not valid: ${hook}`);
					}
					hookFunctions[hook] = async (payload) => {
						return await messageSocket.sendRequest(hook, payload);
					};
				});

				resolveProvidePlugin({
					data,
					settings,
					hooks: hookFunctions,
				});
			} catch (error) {
				rejectProvidePlugin(error);
				throw new Error(error.message);
			}
			return Object.keys(methods);
		}
	});
}
