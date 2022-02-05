import PostMessageSocket from "./postMessageSocket";

export class PluginInterface extends PostMessageSocket {
	#hooks;
	#methods;

	constructor({ hooks = [], methods = {} }, currentWindow = window, targetWindow = window.parent) {
		super(currentWindow, targetWindow);
		this.#hooks = ["error", ...hooks]; // WE ALWAYS PROVIDE THE ERROR HOOK, SINCE WE USE IT DURING INIT
		this.#methods = methods;
	}

	#sendDomReady() {
		this.sendMessage("domReady", {
			config: {
				hooks: this.#hooks,
				methods: Object.keys(this.#methods),
			},
		});
	}

	getInterface() {
		Object.keys(this.#methods).forEach((methodName) => {
			this.addListener(methodName, payload => this.#methods[methodName](payload));
		});
		return new Promise((resolve) => {
			this.addListener("init", onInit.bind(this), { once: true });
			if (this.getDocument().readyState === "loading") {
				this.getDocument().addEventListener("DOMContentLoaded", this.#sendDomReady.bind(this), { once: true });
			} else {
				this.#sendDomReady.call(this);
			}

			function onInit({ data = null, settings = null, hooks = [] } = {}) {
				const hookFunctions = {};

				hooks.forEach((hook) => {
					if (!this.#hooks.includes(hook)) {
						this.sendMessage("error", `The following hook is not valid: ${hook}`);
						return;
					}
					hookFunctions[hook] = async (payload) => {
						return await this.sendRequest(hook, payload);
					};
				});

				this.#hooks.forEach((hook) => {
					if (hookFunctions[hook]) return;
					this.sendMessage("error", `The following hook is not set up: ${hook}`);
				});

				resolve({
					data,
					settings,
					hooks: hookFunctions,
				});
			}
		});
	}
}

export default async function createProvidePlugin({ hooks = [], methods = {} }, currentWindow = window, targetWindow = window.parent) {
	const plugin = new PluginInterface({ hooks, methods }, currentWindow, targetWindow);
	return await plugin.getInterface();
}
