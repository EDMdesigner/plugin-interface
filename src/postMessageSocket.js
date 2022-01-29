import { nanoid }  from 'nanoid'

export default class PostMessageSocket {
	socketId;
	messenger;
	target;
	listeners;
	msgIdGenerator;

	constructor(messenger, target, options = {}) {		
		this.socketId = nanoid();
		this.messenger = messenger;
		this.target = target;		
		this.listeners = {}

		this.msgIdGenerator = this.#msgIdGenerator();

		this.messenger.addEventListener("message", this.onMessage.bind(this));
	}

	addListener(type, callback, { once = false } = {}) {
		this.listeners[type] = { callback, once };
	}

	removeListener(type) {
		delete listeners[type];
	}

	send(type, payload) {
		console.log(type);
		this.target.postMessage(JSON.stringify({ type, payload }), "*");
		
	}

	request(type, payload) {		
		const msgId = this.#getNextMsgId();
		console.log(msgId);
		this.target.postMessage(JSON.stringify({ type, payload, msgId }), "*");
	
		return new Promise((resolve, reject) => {			
			const waitForResponse = (event) => {
				if (event.source !== this.target) return;
				
				try {
					const response = JSON.parse(event.data);				
					if (response.msgId !== msgId) return;
					
					this.messenger.removeEventListener("message", waitForResponse);
					
					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response.payload);
					}
				} catch (e) {
					window.removeEventListener("message", waitForResponse);
					reject(e);
				}
			}
			this.messenger.addEventListener("message", waitForResponse);
		});
	}

	async onMessage(event) {
		console.log(event);
		if (event.source !== this.target) return;		
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
				this.target.postMessage(JSON.stringify(response), "*");
			}
		}

		try {
			respond({ payload: await listener.callback(message.payload) });
		} catch (error) {
			respond({ error });
		}

		if (listener.once) {
			delete this.listeners[message.type];
		}
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
