export default class PostMessageSocket {
	#currentWindow;

	#targetWindow;

	#listeners;

	#msgIdGenerator;

	constructor(currentWindow, targetWindow) {
		// this.socketId = nanoid(8); // Do we need it? If not we don't need nanoid!
		this.#currentWindow = currentWindow;
		this.#targetWindow = targetWindow;
		this.#listeners = {};
		this.#setupSocket();
	}

	addListener(type, callback, { once = false } = {}) {
		this.#listeners[type] = { callback, once };
	}

	removeListener() {
		// TODO: finish this!
	}

	sendMessage(type, payload) {
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");
	}

	sendRequest(type, payload) {
		const msgId = this.#getNextMsgId();
		this.#targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");

		return new Promise((resolve, reject) => {
			const waitForResponse = (event) => {
				if (event.source !== this.#targetWindow) return;

				try {
					const response = JSON.parse(event.data);
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
			this.#currentWindow.addEventListener("message", waitForResponse.bind(this));
		});
	}

	terminate() {
		// TODO: finish this!
	}

	#setupSocket() {
		function* msgIdGenerator() {
			let msgId;
			while (true) {
				yield `${msgId++}-${new Date().getTime()}`;
			}
		}
		this.#msgIdGenerator = msgIdGenerator.call(this);
		this.#currentWindow.addEventListener("message", this.#onMessage.bind(this));
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

	#removeListener(type) {
		delete this.#listeners[type];
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
