import { nanoid }  from 'nanoid'

export default class PostMessageSocket {
	socketId;
	currentWindow;
	target;
	listeners;
	msgIdGenerator;

	constructor(currentWindow, targetWindow, options = {}) {		
		this.socketId = nanoid();
		this.currentWindow = currentWindow;
		this.targetWindow = targetWindow;		
		this.listeners = {}

		this.msgIdGenerator = this.#msgIdGenerator();
		this.currentWindow.addEventListener("message", this.onMessage.bind(this));
	}

	addListener(type, callback, { once = false } = {}) {
		this.listeners[type] = { callback, once };
	}

	sendMessage(type, payload) {
		this.targetWindow.postMessage(JSON.stringify({ type, payload }), "*");	
	}

	sendSignal(type, payload) {		
		const msgId = this.#getNextMsgId();
		this.targetWindow.postMessage(JSON.stringify({ type, payload, msgId }), "*");
	
		return new Promise((resolve, reject) => {			
			const waitForResponse = (event) => {
				if (event.source !== this.targetWindow) return;
				
				try {
					const response = JSON.parse(event.data);				
					if (response.msgId !== msgId) return;
					
					this.currentWindow.removeEventListener("message", waitForResponse);
					
					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response.payload);
					}
				} catch (e) {
					this.currentWindow.removeEventListener("message", waitForResponse);
					reject(e);
				}
			}
			this.currentWindow.addEventListener("message", waitForResponse.bind(this));
		});
	}

	async onMessage(event) {
		if (event.source !== this.targetWindow) return;
		const message = this.#tryParse(event);
		if (!message) return;

		const listener = this.listeners[message.type];
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
				this.targetWindow.postMessage(JSON.stringify(response), "*");
			}
		}

		try {
			respond({ payload: await listener.callback(message.payload) });
		} catch (error) {
			respond({ error });
		}

		if (listener.once) {
			this.#removeListener(message.type)
		}
	}

	#removeListener(type) {
		delete this.listeners[type];
	}

	#tryParse(event) {
		try {
			return JSON.parse(event.data);
		} catch (err) {}
	}	

	*#msgIdGenerator() {
		while(true) {
			yield `${this.socketId}-${nanoid(6)}-${new Date().getTime()}`;
		};
	}
	
	#getNextMsgId() {
		return this.msgIdGenerator.next().value;
	}
}
