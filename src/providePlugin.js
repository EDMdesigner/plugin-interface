import PostMessageSocket from "./postMessageSocket.js";
import { initUpdateHookList } from "./updateHooks.js";

export default function providePlugin({ hooks = [], methods = {}, validator = null } = {}, currentWindow = window, targetWindow = window.parent) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	const updateHooksList = initUpdateHookList(hooks, messageSocket, validator);

	Object.keys(methods).forEach((methodName) => {
		if (methodName === "updateHooks") {
			messageSocket.addListener("updateHooks", async payload => await methods.updateHooks(await updateHooksList(payload)));
		} else {
			messageSocket.addListener(methodName, payload => methods[methodName](payload));
		}
	});

	let ack = false;

	async function sendDomReady() {
		messageSocket.addListener("ackDomReady", () => {
			ack = true;
		}, { once: true });

		while (!ack) {
			await new Promise((resolve) => {
				messageSocket.sendMessage("domReady", {});
				setTimeout(() => {
					resolve();
				}, 200);
			});
		}
	}

	if (messageSocket.getDocument().readyState === "loading") {
		messageSocket.getDocument().addEventListener("DOMContentLoaded", sendDomReady, { once: true });
	} else {
		sendDomReady();
	}

	return new Promise((resolveProvidePlugin, rejectProvidePlugin) => {
		messageSocket.addListener("init", onInit, { once: true });

		// eslint-disable-next-line no-shadow
		async function onInit({ data = null, settings = null, hooks = [] } = {}) {
			ack = true;
			try {
				if (typeof validator === "function") {
					await validator({ data, settings });
				}
				// We have to wrap the function to resolve since the
				// private field implementation in ES6 doesn't allow
				// resolve directly the function. It gives and error.
				const terminate = () => {
					messageSocket.terminate();
				};

				resolveProvidePlugin({
					data,
					settings,
					hooks: await updateHooksList(hooks),
					terminate,
				});
			} catch (error) {
				rejectProvidePlugin(error);
				throw new Error(error.message);
			}

			return Object.keys(methods);
		}
	});
}
