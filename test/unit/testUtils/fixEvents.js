// workaround for https://github.com/jsdom/jsdom/issues/2745
// if no origin exists, replace it with the right targetWindow

function fixEvents(currentWindow, targetWindow, event) {
	if (!event.origin || event.origin === "" || event.origin === null) {
		event.stopImmediatePropagation();
		const eventWithOrigin = new MessageEvent("message", {
			data: event.data,
			origin: targetWindow,
			source: targetWindow,
		});
		currentWindow.dispatchEvent(eventWithOrigin);
	}
}

let fixEventsBinded;
function addFixEvents(currentWindow, targetWindow) {
	fixEventsBinded = fixEvents.bind(null, currentWindow, targetWindow);
	currentWindow.addEventListener("message", fixEventsBinded, true);
}

function removeFixEvents(windowObject) {
	windowObject.removeEventListener("message", fixEventsBinded, true);
}

export { addFixEvents, removeFixEvents };
