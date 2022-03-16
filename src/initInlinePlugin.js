import { createInitPlugin } from "./initPlugin.js";

export default async function initInlinePlugin({ data, settings, hooks }, { container, src, beforeInit, timeout }) {
	const { methods } = await createInitPlugin({
		data,
		settings,
		hooks,
	}, {
		container,
		src,
		timeout,
		beforeInit,
	});

	function destroy() {
		while (container.firstChild) {
			container.firstChild.remove();
		}
	}

	return {
		methods,
		destroy,
		_container: container,
	};
}
