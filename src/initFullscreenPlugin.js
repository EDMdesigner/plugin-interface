import { createInitPlugin } from "./initPlugin.js";

let currentZIndex = 0;
export default async function initFullscreenPlugin({ data, settings, hooks }, { id, src, parentElem, beforeInit = null, timeout }) {
	let container = document.createElement("div");
	container.id = id;
	container.style.position = "fixed";
	container.style.display = "flex";
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
	container.style.border = "0";
	container.style.margin = "0";
	container.style.padding = "0";
	container.style.transition = "transform 0s";

	const parent = parentElem || document.body;
	parent.appendChild(container);

	let splashScreen;
	function showSplashScreen() {
		if (!settings.splashScreenUrl) return;
		return new Promise((resolve) => {
			splashScreen = document.createElement("iframe");
			splashScreen.src = settings.splashScreenUrl;

			splashScreen.style.position = "absolute";
			splashScreen.style.top = "0";
			splashScreen.style.left = "0";
			splashScreen.style.width = "100%";
			splashScreen.style.height = "100%";
			splashScreen.style.opacity = "1";
			splashScreen.style.border = "0";
			splashScreen.style.margin = "0";
			splashScreen.style.padding = "0";
			splashScreen.style.transition = "opacity 0.5s";
			container.appendChild(splashScreen);
			splashScreen.addEventListener("load", resolve, { once: true });
		});
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
		defaultAnimationTime = time;
		hiddenPosition = `translate3d(${x}, ${y}, 0px) scale(${scale})`;
		hiddenOpacity = opacity;
		currentZIndex++;
		container.style.zIndex = currentZIndex;
		container.style.overflow = "hidden";

		window.requestAnimationFrame(() => {
			container.style.transition = "transform 0s";
			container.style.transform = `translate3d(${x}, ${y}, 0px) scale(${scale})`;
			container.style.opacity = opacity;
			container.style.display = "block";

			return new Promise((resolve) => {
				window.requestAnimationFrame(() => {
					container.style.transition = `all ${time}ms`;
					container.style.transform = "translate3d(0px, 0px, 0px) scale(1)";
					container.style.opacity = "1";
					isVisible = true;
					const transitionEnded = (e) => {
						if (e.propertyName !== "opacity" && e.propertyName !== "transform") return;
						resolve();
					};
					container.addEventListener("transitionend", transitionEnded, { once: true });
				});
			});
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
			if (hiddenOpacity === 0) {
				container.style.display = "none";
			}
			const transitionEnded = (e) => {
				if (e.propertyName !== "opacity" && e.propertyName !== "transform") return;
				resolve();
			};
			container.addEventListener("transitionend", transitionEnded, { once: true });
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
