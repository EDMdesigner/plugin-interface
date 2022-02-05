import PostMessageSocket from "./postMessageSocket.js";

export class InitPlugin extends PostMessageSocket {
	#hooks;
	#settings;
	#data;

	constructor({ data = {}, settings = {},	hooks = {} }, currentWindow, targetWindow) {
		super(currentWindow, targetWindow);
		this.#data = data;
		this.#settings = settings;
		this.#hooks = hooks;

		if (!this.#hooks.error) {
			this.#hooks.error = (e) => {
				throw new Error(e);
			};
		}
	}

	init() {
		return new Promise((resolve) => {
			this.addListener("domReady", onDomReady.bind(this), { once: true });

			Object.keys(this.#hooks).forEach((hook) => {
				this.addListener(hook, payload => this.#hooks[hook](payload));
			});

			function onDomReady(payload) {
				this.sendMessage("init", { data: this.#data, settings: this.#settings, hooks: Object.keys(this.#hooks) });

				const methods = {};
				payload.config.methods.forEach((type) => {
					methods[type] = async (data) => {
						return await this.sendRequest(type, data); // QA: Do we need here request? And async functionality???
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
}

export default async function createInitPlugin({ data, settings, hooks }, currentWindow, targetWindow) {
	const pluginInterface = new InitPlugin({ data, settings, hooks }, currentWindow, targetWindow);
	return await pluginInterface.init();
}
