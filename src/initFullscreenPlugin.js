/* eslint-disable no-unused-vars */
import { createInitPlugin } from "./initPlugin.js";

export default async function initFullscreenPlugin({ id, src, data, settings, hooks }, { beforeInit = null, timeout }) {
	const defaultAnimationTime = 500;
	let container = document.createElement("div");
	container.id = id;
	container.style.position = "fixed";
	// Hide to the top
	container.style.top = "-101vh";
	container.style.left = "0";
	container.style.width = "100%";
	container.style.height = "100%";
	container.style.transition = `all ${defaultAnimationTime / 1000}s`;

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
	function show(animationType, time) {
		const animationTime = typeof time === "number" ? time : defaultAnimationTime;
		switch (animationType) {
			case "slideFromTop":
				startShowAnimation({ top: "-100vh" });
				break;
			case "slideFromBottom":
				startShowAnimation({ top: "100vh" });
				break;
			case "slideFromLeft":
				startShowAnimation({ left: "-100vw" });
				break;
			case "slideFromRight":
				startShowAnimation({ left: "100vw" });
				break;
			case "fade":
				startShowAnimation({});
				break;
			case "scale":
				startShowAnimation({ left: "50vw", top: "50vh", height: "0", width: "0" });
				break;
			default:
				startShowAnimation({ left: "-100vw" });
				break;
		}
		function startShowAnimation({ top = "0", left = "0", opacity = "0", height = "100%", width = "100%", transition }) {
			window.requestAnimationFrame(() => {
				container.style.overflow = "hidden";
				container.style.transition = "all 0s";
				container.style.opacity = opacity;
				container.style.left = left;
				container.style.top = top;
				container.style.height = height;
				container.style.width = width;
				window.requestAnimationFrame(() => {
					container.style.transition = `all ${animationTime / 1000}s`;
					container.style.opacity = "1";
					container.style.left = "0";
					container.style.top = "0";
					container.style.height = "100%";
					container.style.width = "100%";
				});
			});
		}
		shown = true;
	}

	function hide(type, time) {
		if (!shown) {
			throw new Error("The plugin is already hidden!");
		}

		const animationTime = typeof time === "number" ? time : defaultAnimationTime;
		switch (type) {
			case "slideFromTop":
				startHideAnimation({ top: "-100vh" });
				break;
			case "slideFromBottom":
				startHideAnimation({ top: "100vh" });
				break;
			case "slideFromLeft":
				startHideAnimation({ left: "-100vw" });
				break;
			case "slideFromRight":
				startHideAnimation({ left: "100vw" });
				break;
			case "fade":
				startHideAnimation({ });
				setTimeout(() => {
					container.style.transition = "all 0s";
					container.style.left = "100vw";
				}, animationTime);
				break;
			case "scale":
				startHideAnimation({ left: "50vw", top: "50vh", width: "0", height: "0" });
				break;
			default:
				container.style.top = "100vh";
				break;
		}
		function startHideAnimation({ top = "0", left = "0", opacity = "0", height = "100%", width = "100%", transition }) {
			window.requestAnimationFrame(() => {
				container.style.overflow = "hidden";
				container.style.transition = `all ${animationTime / 1000}s`;
				container.style.opacity = opacity;
				container.style.left = left;
				container.style.top = top;
				container.style.height = height;
				container.style.width = width;
			});
		}

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

	const { methods } = await createInitPlugin({ data, settings, hooks }, { container, src }, beforeInit);

	return {
		methods,
		_container: container,
		_src: src,
		showSplashScreen,
		hideSplashScreen,
		show,
		hide,
		destroy,
	};
}
