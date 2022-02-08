import PostMessageSocket from "./postMessageSocket.js";

export default function createInitPlugin({ data, settings, hooks }, currentWindow, targetWindow) {
	const messageSocket = new PostMessageSocket(currentWindow, targetWindow);

	Object.keys([{ error: payload => console.warn(payload) }, ...hooks]).forEach((hook) => {
		messageSocket.addListener(hook, payload => hooks[hook](payload));
	});

	return new Promise((resolve) => {
		messageSocket.addListener("domReady", onDomReady, { once: true });
		async function onDomReady() {
			const methods = await messageSocket.sendRequest("init", { data, settings, hooks: Object.keys(hooks) });

			methods.forEach((type) => {
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
