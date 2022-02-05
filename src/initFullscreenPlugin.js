/* eslint-disable no-unused-vars */
import createInitPlugin from "./initPlugin.js";

export default async function initFullscreenPlugin({ id, src, data, settings, hooks }) {
	let container = document.createElement("div");
	container.id = id;
	container.style.position = "fixed";
	container.style.top = "0";
	container.style.left = "0";
	container.style.width = "100vw";
	container.style.height = "100vh";
	container.style.marginTop = "100vw";
	container.style.transition = "margin-top 0.5s";

	document.body.appendChild(container);

	let splashScreen;
	function showSplashScreen() {
		splashScreen = document.createElement("iframe");
		splashScreen.src = settings.splashScreenUrl;

		splashScreen.style.position = "absolute";
		splashScreen.style.top = "0";
		splashScreen.style.left = "0";
		splashScreen.style.width = "100%";
		splashScreen.style.height = "100%";
		splashScreen.style.opacity = "1";
		splashScreen.style.transition = "opacity 0.5s";

		container.appendChild(splashScreen);
	}

	function hideSplashScreen() {
		if (!splashScreen) {
			return;
		}

		splashScreen.style.opacity = "0";

		setTimeout(() => {
			splashScreen.remove();
		}, 500);
	}

	let shown = false;
	function show() {
		container.style.marginTop = "0";
		shown = true;
	}

	function hide() {
		if (!shown) {
			throw new Error("The plugin is already hidden!");
		}

		container.style.marginTop = "100vh";

		return new Promise((resolve, reject) => {
			if (!container) {
				reject(new Error("Plugin is already destroyed!"));
			}
			setTimeout(() => {
				resolve();
			}, 500);
		});
	}

	async function destroy() {
		await hide();
		container.remove();
		container = null;
	}

	// eslint-disable-next-line no-unused-vars
	// eslint-disable-next-line no-shadow
	function beforeInit({ container, iframe }) {
		iframe.style.width = "100%";
		iframe.style.height = "100%";
	}

	// eslint-disable-next-line no-shadow
	function createPluginIframe({ container, src }, beforeInit) {
		const pluginIframe = document.createElement("iframe");
		pluginIframe.src = src;
		pluginIframe.allowFullscreen = "allowfullscreen";

		if (typeof beforeInit === "function") {
			beforeInit({ container, iframe: pluginIframe });
		}
		container.appendChild(pluginIframe);

		return pluginIframe;
	}

	const pluginIframe = createPluginIframe({ container, src }, beforeInit);

	const plugin = await createInitPlugin({ data, settings, hooks }, window, pluginIframe.contentWindow);

	return {
		...plugin,
		_container: container,
		_src: src,
		showSplashScreen,
		hideSplashScreen,
		show,
		hide,
		destroy,
	};
}
