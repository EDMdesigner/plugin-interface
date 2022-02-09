import initPlugin from "./initPlugin.js";

export default async function initInlinePlugin({ container, src, data, settings, hooks }, { beforeInit, timeout }) {
	const plugin = await initPlugin({
		container,
		src,
		data,
		settings,
		hooks,
	}, {
		timeout,
		beforeInit,
	});

	function destroy() {
		while (container.firstChild) {
			container.firstChild.remove();
		}
	}

	return {
		...plugin,
		destroy,
	};
}
