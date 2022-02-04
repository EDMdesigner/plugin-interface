import PostMessageSocket from "./postMessageSocket.js";

export default class InitPlugin extends PostMessageSocket {
	constructor({ data = {}, settings = {},	hooks = {} }, currentWindow, targetWindow) {
		super(currentWindow, targetWindow);
		this.data = data;
		this.settings = settings;
		this.hooks = hooks;
	}

	init() {
		return new Promise((resolve) => {
			this.addListener("domReady", onDomReady.bind(this), { once: true });

			Object.keys(this.hooks).forEach((hook) => {
				this.addListener(hook, payload => this.hooks[hook](payload));
			});

			function onDomReady(payload) {
				this.sendMessage("init", { data: this.data, settings: this.settings, hooks: Object.keys(this.hooks) });

				const methods = {};

				payload.config.methods.forEach((type) => {
					methods[type] = (data) => {
						return this.sendMessage(type, data); // QA: Do we need here request? And async functionality???
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
