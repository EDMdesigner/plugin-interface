export default class PostMessageSocket {
	#currentWindow;

	#targetWindow;

	#listeners = {};

	#msgIdGenerator;

	#appliedEventListners = [];

	constructor(currentWindow, targetWindow) {
		// this.socketId = nanoid(8); // Do we need it? If not we don't need nanoid!
		this.#currentWindow = currentWindow;
		this.#targetWindow = targetWindow;
		this.#setupSocket();
	}

	addListener(type, callback, { once = false } = {}) {
		this.#listeners[type] = { callback, once };
	}

	sendMessage(type, payload) {
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");
	}

	sendRequest(type, payload) {
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");
		this.#waitForResponse(msgId);
	}

	terminate() {
		this.#appliedEventListners.forEach((listener) => {
			this.#currentWindow.removeEventListener("message", listener);
		});
		this.#currentWindow = null;
		this.#targetWindow = null;
	}

	#removeListener(type) {
		delete this.#listeners[type];
	}

	#waitForResponse(msgId) {
		return new Promise((resolve, reject) => {
			const waitForResponse = (event) => {
				if (event.source !== this.#targetWindow) return;
				try {
					const response = this.#tryParse(event);
					if (response.msgId !== msgId) return;

					this.#currentWindow.removeEventListener("message", waitForResponse);

					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response.payload);
					}
				} catch (error) {
					this.#currentWindow.removeEventListener("message", waitForResponse);
					reject(new Error(error));
				}
			};
			const messageHandler = waitForResponse.bind(this);
			this.#currentWindow.addEventListener("message", waitForResponse.bind(this));
			this.#appliedEventListners.push(messageHandler);
		});
	}

	#setupSocket() {
		function* msgIdGenerator() {
			let msgId = 0;
			while (this.#currentWindow) {
				yield `${msgId++}-${new Date().getTime()}`;
			}
		}
		this.#msgIdGenerator = msgIdGenerator.call(this);

		const messageHandler = this.#onMessage.bind(this);
		this.#currentWindow.addEventListener("message", messageHandler);
		this.#appliedEventListners.push(messageHandler);
	}

	async #onMessage(event) {
		if (event.source !== this.#targetWindow) return;

		const message = this.#tryParse(event);
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
				this.#targetWindow.postMessage(JSON.stringify(response), "*");
			}
		};

		try {
			respond({ payload: await listener.callback(message.payload) });
		} catch (error) {
			respond({ error });
		}

		if (listener.once) {
			this.#removeListener(message.type);
		}
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
}
