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

	addListener(type, callback, { once = false } = {}) {
		if (!this.#currentWindow) return;
		this.#listeners[type] = { callback, once };
	}

	#removeListener(type) {
		delete this.#listeners[type];
	}

	sendMessage(type, payload) {
		if (!this.#targetWindow && this.#isTerminated) return;
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");
	}

	sendRequest(type, payload) {
		if (!this.#targetWindow && this.#isTerminated) return;
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");
		return this.#waitForResponse(msgId);
	}

	#waitForResponse(msgId) {
		return new Promise((resolve, reject) => {
			const waitForResponse = (event) => {
				console.log("HEREEEEEEE");
				console.log(event);
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
						reject(new Error(response.error));
					} else {
						resolve(response.payload);
					}
				} catch (error) {
					this.#currentWindow.removeEventListener("message", listener.handler, listener.useCapture);
					this.#appliedEventListeners.splice(index, 1);
					reject(new Error(error));
				}
			};
			const handler = waitForResponse.bind(this);
			this.#currentWindow.addEventListener("message", handler, true);
			this.#appliedEventListeners.push({ _id: msgId, handler, useCapture: true });
		});
	}

	async #onMessage(event) {
		if (event.source !== this.#targetWindow) return;

		const message = this.#tryParse(event);
		console.log(message);
		if (!message) return;

		const listener = this.#listeners[message.type];
		if (!listener) return;

		const respond = ({ error, payload }) => {
			const response = { msgId: message.msgId };

			if (typeof error === "string") {
				response.error = error;
			} else if (error) {
				response.error = error.message || "Unexpected error";
			} else {
				response.payload = payload;
			}

			if (event.source) {
				console.log(response);
				this.#targetWindow.postMessage(JSON.stringify(response), "*");
			}
		};

		try {
			const resp = await listener.callback(message.payload);
			respond({ payload: resp});
		} catch (error) {
			respond({ error });
		}

		if (listener.once) {
			this.#removeListener(message.type);
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
