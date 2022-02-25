import { createInitPlugin } from "./initPlugin.js";

export default async function initInlinePlugin({ container, src, data, settings, hooks }, { beforeInit, timeout }) {
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
