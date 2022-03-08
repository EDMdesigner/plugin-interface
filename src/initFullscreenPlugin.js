/* eslint-disable no-unused-vars */
import { createInitPlugin } from "./initPlugin.js";

let currentZIndex = 0;

export default async function initFullscreenPlugin({ id, src, data, settings, hooks }, { parentElem, beforeInit = null, timeout }) {
	let container = document.createElement("div");
	container.id = id;
	container.style.position = "fixed";
	container.style.top = "0";
	container.style.left = "0";
	container.style.zIndex = 0;
	// Hide to the top
	let defaultAnimationTime = 1500;
	let hiddenPosition = "translate3d(-100vw, 0px, 0px) scale(1)";
	let hiddenOpacity = 0;
	container.style.transform = hiddenPosition;
	container.style.opacity = hiddenOpacity;
	container.style.width = "100%";
	container.style.height = "100%";
	container.style.transition = `transform ${defaultAnimationTime / 1000}s easy-in-out`;

	const parent = parentElem || document.body;
	parent.appendChild(container);

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
	function show({ x = "-100vw", y = "0px", opacity = 1, scale = 1, time } = {}) {
		hiddenPosition = `translate3d(${x}, ${y}, 0px) scale(${scale})`;
		hiddenOpacity = opacity;
		currentZIndex++;
		container.style.zIndex = currentZIndex;
		if (time && typeof time !== "number") {
			defaultAnimationTime = time ;
		}
		window.requestAnimationFrame(() => {
			container.style.transition = "all 0s";
			container.style.overflow = "hidden";
			container.style.opacity = hiddenOpacity;
			container.style.transform = hiddenPosition;
			window.requestAnimationFrame(() => {
				container.style.transition = `transform ${defaultAnimationTime / 1000}s`;
				container.style.opacity = "1";
				container.style.transform = "translate3d(0px, 0px, 0px) scale(1)";
			});
		});
		shown = true;
	}

	function hide() {
		if (!shown) {
			throw new Error("The plugin is already hidden!");
		}
		window.requestAnimationFrame(() => {
			container.style.overflow = "hidden";
			container.style.transition = `all ${defaultAnimationTime / 1000}s`;
			container.style.opacity = hiddenOpacity;
			container.style.transform = hiddenPosition;
		});

		shown = false;
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

	const { methods } = await createInitPlugin({ data, settings, hooks }, { container, src, beforeInit, timeout });

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
