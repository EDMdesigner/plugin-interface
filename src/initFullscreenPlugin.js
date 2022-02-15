/* eslint-disable no-unused-vars */
import { createIframeAndInitPlugin } from "./initPlugin.js";

export default async function initFullscreenPlugin({ id, src, data, settings, hooks }, { beforeInit = null, timeout }) {
	settings.animationTime = typeof settings.animationTime === "number" ? settings.animationTime : 500;
	let container = document.createElement("div");
	container.id = id;
	container.style.position = "fixed";
	container.style.top = "0";
	container.style.left = "0";
	container.style.width = "100%";
	container.style.height = "100%";
	setInitialPosition(settings.showAnimation);
	container.style.transition = `all ${settings.animationTime / 1000}s`;

	document.body.appendChild(container);

	let splashScreen;
	function showSplashScreen() {
		if (!settings.splashScreenUrl) {
			return;
		}
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
		switch (settings.showAnimation) {
			case "slideFromTop":
			case "slideFromBottom":
			case "slideFromLeft":
			case "slideFromRight":
				container.style.opacity = "1";
				container.style.transition = `all ${settings.animationTime / 1000}s`;
				container.style.left = "0";
				container.style.top = "0";
				break;
			case "fade":
				window.requestAnimationFrame(() => {
					container.style.transition = "all 0ss";
					container.style.left = "0";

					window.requestAnimationFrame(() => {
						container.style.transition = `all ${settings.animationTime / 1000}s`;
						container.style.opacity = "1";
					});
				});

				break;
			case "scale":
				container.style.transition = `all ${settings.animationTime / 1000}s`;
				container.style.opacity = "1";
				container.style.left = "0";
				container.style.top = "0";
				container.style.height = "100%";
				container.style.width = "100%";
				break;
			default:
				container.style.top = "0";
				break;
		}
		shown = true;
	}

	function setInitialPosition(animation) {
		container.style.opacity = "0";
		container.style.transition = `all ${settings.animationTime / 1000}s`;
		switch (animation) {
			case "slideFromTop":
				container.style.top = "-100vh";
				break;
			case "slideFromBottom":
				container.style.top = "100vh";
				break;
			case "slideFromLeft":
				container.style.left = "-100vw";
				break;
			case "slideFromRight":
				container.style.left = "100vw";
				break;
			case "fade":
				container.style.opacity = "0";
				container.style.transition = `all ${settings.animationTime / 1000}s`;
				setTimeout(() => {
					container.style.transition = "all 0ss";
					container.style.left = "100vw";

					window.requestAnimationFrame(() => {
						container.style.transition = `all ${settings.animationTime / 1000}s`;
					});
				}, 500);

				break;
			case "scale":
				container.style.overflow = "hidden";
				container.style.transition = `all ${settings.animationTime / 1000}s`;
				container.style.left = "50vw";
				container.style.top = "50vh";
				container.style.height = "0";
				container.style.width = "0";
				container.style.opacity = "0";
				break;
			default:
				container.style.top = "100vh";
				break;
		}
	}

	function hide() {
		if (!shown) {
			throw new Error("The plugin is already hidden!");
		}

		setInitialPosition(settings.showAnimation);

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

	let _beforeInit = beforeInit;

	if (!_beforeInit || typeof _beforeInit !== "function") {
		_beforeInit = function ({ iframe }) {
			iframe.style.width = "100%";
			iframe.style.height = "100%";
		};
	}

	const { methods } = await createIframeAndInitPlugin({ data, settings, hooks }, { container, src }, beforeInit);

	return {
		_container: container,
		_src: src,
		methods,
		showSplashScreen,
		hideSplashScreen,
		show,
		hide,
		destroy,
	};
}
