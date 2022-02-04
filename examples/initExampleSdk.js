import initFullscreenPlugin from "../src/initFullscreenPlugin.js";
import initInlinePlugin from "../src/initInlinePlugin.js";

export default function initExampleSdk({ settings: { splashScreenUrl } = {} }) {
	function initInlineAdPlugin({ container, data, settings, hooks }, { beforeInit, timeout }) {
		const src = "./plugins/inline-ad.html";
		// we could define the beforeInit here to set the dimensions from the settings object
		return initInlinePlugin({ container, src, data, settings, hooks }, { beforeInit, timeout });
	}

	function initContentEditorPlugin({ data, settings, hooks }) {
		const src = "./plugins/content-editor.html";
		return initFullscreenPlugin({ id: "content-editor", src, data, settings: { ...settings, splashScreenUrl }, hooks });
	}

	return {
		initInlineAdPlugin,
		initContentEditorPlugin,
	};
}
