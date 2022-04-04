import { createInitPlugin } from "./initPlugin.js";

export default async function initInlinePlugin({ data, settings, hooks }, { src, container, beforeInit = null, timeout }) {
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
		_container: container,
		methods,
		destroy,
	};
}
