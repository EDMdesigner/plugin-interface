import createInitPlugin from "./initPlugin";

export class FullScreenPlugin {
	container;
	pluginIframe;
	isVisible;
	methods;
	splashScreen;
	initPlugin;

	constructor({ id, src, data, settings, hooks }) {
		this.data = data;
		this.settings = settings;
		this.hooks = hooks;
		this.isVisible = false;

		this.createPluginIframe({ id, src });
	}

	createPluginIframe({ id, src }) {
		this.container = document.createElement("div");
		this.container.id = id;
		this.container.style.position = "fixed";
		this.container.style.top = "0";
		this.container.style.left = "0";
		this.container.style.width = "100vw";
		this.container.style.height = "100vh";
		this.container.style.marginTop = "100vw";
		this.container.style.transition = "margin-top 0.5s";
		document.body.appendChild(this.container);

		this.pluginIframe = document.createElement("iframe");
		this.pluginIframe.src = src;
		this.pluginIframe.allowFullscreen = "allowfullscreen";
		this.pluginIframe.style.width = "100%";
		this.pluginIframe.style.height = "100%";

		this.container.appendChild(this.pluginIframe);
	}

	showSplashScreen() {
		this.splashScreen = document.createElement("iframe");
		this.splashScreen.src = this.settings.splashScreenUrl;
		this.splashScreen.style.position = "absolute";
		this.splashScreen.style.top = "0";
		this.splashScreen.style.left = "0";
		this.splashScreen.style.width = "100%";
		this.splashScreen.style.height = "100%";
		this.splashScreen.style.opacity = "1";
		this.splashScreen.style.transition = "opacity 0.5s";

		this.container.appendChild(this.splashScreen);
	}

	hideSplashScreen() {
		if (!this.splashScreen) {
			return;
		}

		this.splashScreen.style.opacity = "0";

		setTimeout(() => {
			this.splashScreen.remove();
		}, 500);
	}

	show() {
		this.container.style.marginTop = "0";
		this.isVisible = true;
	}

	hide() {
		if (!this.isVisible) {
			throw new Error("The plugin is already hidden!");
		}

		this.container.style.marginTop = "100vh";

		return new Promise((resolve, reject) => {
			if (!this.container) {
				reject(new Error("Plugin is already destroyed!"));
			}
			setTimeout(() => {
				resolve();
			}, 500);
		});
	}

	async destroy() {
		await this.hide();
		this.container.remove();
		this.container.innerHTML = "";
		this.container = null;
	}

	async init() {
		this.initPlugin = await createInitPlugin({ data: this.data, settings: this.settings, hooks: this.hooks }, window, this.pluginIframe.contentWindow);
		this.methods = this.initPlugin.methods;
	}
}

export default async function createFullscreenPlugin({ id = "", src = "", data = {}, settings = {}, hooks = {} }) {
	const fullScreenPlugin = new FullScreenPlugin({ id, src, data, settings, hooks });
	await fullScreenPlugin.init();
	return fullScreenPlugin;
}
