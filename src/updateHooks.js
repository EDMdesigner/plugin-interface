export function initUpdateHookList(hooks, messageSocket, validator) {
	const pluginHookList = hooks;
	const currentValidator = validator;
	const currentMessageSocket = messageSocket;

	if (!pluginHookList.includes("error")) {
		pluginHookList.push("error");
	}

	return async function (currentHooks) {
		if (!currentHooks.includes("error")) {
			currentHooks.push("error");
		}

		if (typeof currentValidator === "function") {
			await currentValidator({ hooks: currentHooks });
		}

		const hookFunctions = {};

		currentHooks.forEach((hook) => {
			if (!pluginHookList.includes(hook)) {
				return currentMessageSocket.sendMessage("error", `The following hook is not valid: ${hook}`);
			}

			hookFunctions[hook] = async (payload) => {
				return await currentMessageSocket.sendRequest(hook, payload);
			};
		});

		return hookFunctions;
	};
}

export default function initUpdateHooks(messageSocket) {
	const currentMessageSocket = messageSocket;
	let hooksFromParent = {};

	currentMessageSocket.addListener("error", payload => console.warn(payload));

	return function ({ hooks, resetHooks }) {
		if (resetHooks) {
			Object.keys(hooksFromParent).forEach((hook) => {
				currentMessageSocket.removeListener(hook);
			});
			hooksFromParent = hooks;
		} else {
			hooksFromParent = { ...hooksFromParent, ...hooks };
		}
		Object.keys(hooksFromParent).forEach((hook) => {
			if (typeof hooksFromParent[hook] !== "function" && hooksFromParent[hook] === null) {
				currentMessageSocket.removeListener(hook);
				return;
			}
			currentMessageSocket.addListener(hook, payload => hooksFromParent[hook](payload));
		});

		return Object.keys(hooksFromParent).filter(hook => typeof hooksFromParent[hook] === "function" && hooksFromParent[hook] !== null);
	};
}
