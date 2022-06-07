import initFullscreenPlugin from "../src/initFullscreenPlugin.js";
import initInlinePlugin from "../src/initInlinePlugin.js";

export default function initExampleSdk({ settings: { splashScreenUrl } = {} }) {
	function initInlineAdPlugin({ data, settings, hooks }, { container, beforeInit, timeout }) {
		const src = "./plugins/inline-ad.html";
		// we could define the beforeInit here to set the dimensions from the settings object
		return initInlinePlugin({ data, settings, hooks }, { container, src, beforeInit, timeout });
	}

	// eslint-disable-next-line no-empty-pattern
	function initContentEditorPlugin({ data, settings, hooks }) {
		const src = "./plugins/content-editor.html";
		return initFullscreenPlugin({ data, settings: { ...settings, splashScreenUrl }, hooks }, {id: "content-editor", src });
	}

	return {
		initInlineAdPlugin,
		initContentEditorPlugin,
	};
}
