/* eslint-disable no-unused-vars */
import { createInitPlugin } from "./initPlugin.js";

let currentZIndex = 0;

export default async function initFullscreenPlugin({ data, settings, hooks }, { id, src, parentElem, beforeInit = null, timeout }) {
	let container = document.createElement("div");
	container.id = id;
	container.style.position = "fixed";
	container.style.top = "0";
	container.style.left = "0";
	container.style.zIndex = 0;
	// Hide to the top
	let defaultAnimationTime = 500;
	let hiddenPosition = "translate3d(-100vw, 0px, 0px) scale(1)";
	let hiddenOpacity = 0;
	container.style.transform = hiddenPosition;
	container.style.opacity = hiddenOpacity;
	container.style.width = "100%";
	container.style.height = "100%";
	container.style.transition = "transform 0.5s easy-in-out";

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

	let isVisible = false;
	function show({ x = "-100vw", y = "0px", opacity = 0.5, scale = 1, time = defaultAnimationTime } = {}) {
		if (isVisible) return;
		if (isNaN(time)) {
			throw new Error("Animation time must be a number!");
		}
		defaultAnimationTime = time ;
		hiddenPosition = `translate3d(${x}, ${y}, 0px) scale(${scale})`;
		hiddenOpacity = opacity;
		currentZIndex++;
		container.style.zIndex = currentZIndex;
		container.style.transition = "transform 0s";
		container.style.overflow = "hidden";
		container.style.opacity = hiddenOpacity;
		container.style.transform = hiddenPosition;

		return new Promise((resolve) => {
			container.style.transition = `transform ${time / 1000}s easy-in-out`;
			container.style.opacity = "1";
			container.style.transform = "translate3d(0px, 0px, 0px) scale(1)";
			isVisible = true;
			const transitionEnded = () => {
				container.removeEventListener("transitionend", transitionEnded);
				resolve();
			};
			container.addEventListener("transitionend", transitionEnded);
		});
	}

	function hide() {
		if (!isVisible) return;
		return new Promise((resolve) => {
			container.style.overflow = "hidden";
			container.style.transition = `transform ${defaultAnimationTime / 1000}s`;
			container.style.opacity = hiddenOpacity;
			container.style.transform = hiddenPosition;
			isVisible = false;
			const transitionEnded = () => {
				container.removeEventListener("transitionend", transitionEnded);
				resolve();
			};
			container.addEventListener("transitionend", transitionEnded);
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
