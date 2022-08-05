export default class PostMessageSocket {
	#currentWindow;
	#targetWindow;
	#listeners = {};
	#msgIdGenerator;
	#appliedEventListeners = [];
	#isTerminated = false;

	constructor(currentWindow, targetWindow) {
		this.#currentWindow = currentWindow;
		this.#targetWindow = targetWindow;
		this.#setupSocket();
	}

	getDocument() {
		if (this.#isTerminated) return;
		return this.#currentWindow.document;
	}

	addListener(type, callback, { once = false } = {}) {
		if (this.#isTerminated) return;
		if (!this.#currentWindow) return;
		this.#listeners[type] = { callback, once };
	}

	removeListener(type) {
		this.#listeners[type] = null;
		delete this.#listeners[type];
	}

	sendMessage(type, payload) {
		if (this.#isTerminated) return;
		if (!this.#targetWindow && this.#isTerminated) return;
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId, waitForResponse: false }), "*");
		return this.#waitForResponse(msgId);
	}

	sendRequest(type, payload) {
		if (this.#isTerminated) return;
		if (!this.#targetWindow && this.#isTerminated) return;
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId, waitForResponse: true }), "*");
		return this.#waitForResponse(msgId);
	}

	#waitForResponse(msgId) {
		if (this.#isTerminated) return;
		return new Promise((resolveWaitForResponse, rejectWaitForResponse) => {
			const waitForResponse = (event) => {
				if (event.source !== this.#targetWindow) return;

				const index = this.#appliedEventListeners.findIndex(hadler => hadler._id === msgId);
				if (index === -1) return;
				const listener = this.#appliedEventListeners[index];

				try {
					const response = this.#tryParse(event);
					if (response.msgId !== msgId) return;
					event.stopPropagation();
					this.#currentWindow.removeEventListener("message", listener.handler, listener.useCapture);
					this.#appliedEventListeners.splice(index, 1);

					if (response.error) {
						rejectWaitForResponse(new Error(response.error));
					} else {
						resolveWaitForResponse(response.payload);
					}
				} catch (error) {
					return;
				}
			};
			const handler = waitForResponse.bind(this);
			this.#currentWindow.addEventListener("message", handler, true);
			this.#appliedEventListeners.push({ _id: msgId, handler, useCapture: true });
		});
	}

	async #onMessage(event) {
		if (this.#isTerminated) return;
		if (!!event.source && event.source !== this.#targetWindow) return;
		let message;
		try {
			message = this.#tryParse(event);
		} catch (error) {
			return;
		}
		if (!message) return; // TODO: We have to renspond with an error or it will timeout

		const listener = this.#listeners[message.type];
		if (!listener) return;

		const respond = ({ error, payload }) => {
			const response = { msgId: message.msgId };

			if (error) {
				response.error = typeof error === "string" ? error : error?.message || "Unexpected error";
			} else {
				response.payload = payload;
			}

			this.#targetWindow.postMessage(JSON.stringify(response), "*");
		};

		try {
			if (message.waitForResponse) {
				respond({ payload: await listener.callback(message.payload) });
			} else {
				await listener.callback(message.payload);
				respond({ payload: "success" });
			}
		} catch (error) {
			respond({ error });
		}

		if (listener.once) {
			this.removeListener(message.type);
		}
	}

	#setupSocket() {
		function* msgIdGenerator() {
			let msgId = 0;
			while (this.#currentWindow && !this.#isTerminated) {
				yield `${msgId++}-${new Date().getTime()}`;
			}
		}
		this.#msgIdGenerator = msgIdGenerator.call(this);

		const messageHandler = this.#onMessage.bind(this);
		this.#currentWindow.addEventListener("message", messageHandler, false);
		this.#appliedEventListeners.push({ _id: `START-${new Date().getTime()}`, handler: messageHandler, useCapture: false });
	}

	#tryParse(event) {
		try {
			return JSON.parse(event.data);
		} catch (err) {
			throw new Error(err);
		}
	}

	#getNextMsgId() {
		return this.#msgIdGenerator.next().value;
	}

	terminate() {
		if (!this.#currentWindow) return;
		while (this.#appliedEventListeners.length) {
			const listener = this.#appliedEventListeners.pop();
			this.#currentWindow.removeEventListener("message", listener.handler, listener.useCapture);
		}
		this.#isTerminated = true;
	}
}
