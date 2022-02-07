import PostMessageSocket from "../../src/postMessageSocket";
import { addFixEvents, removeFixEvents } from "./testUtils/fixEvents";
import { sideEffectsMapper, createEventListenerSpy, resetJSDOM } from "./testUtils/jsdomReset";

describe("set up postMessageSocket environments", () => {
	let pluginIframe;
	const messages = [];
	let windowSocket;
	let iframeSocket;
	let body;

	const messageCallback = data => messages.push(data);

	const testWindowSocketOnce = "testWindowSocketOnce";
	const testiframeSocketSocketOnce = "testiframeSocketSocketOnce";
	const testWindowSocket = "testWindowSocket";
	const testiframeSocketSocket = "testiframeSocketSocket";
	const messageOne = "This is the first message";
	const messageTwo = "This is the second message";

	const sideEffects = sideEffectsMapper(window, document);

	beforeAll(() => {
		createEventListenerSpy(sideEffects);
	});

	beforeEach(() => {
		resetJSDOM(document, sideEffects);
	});

	describe("postMessageSocket tests", function () {
		beforeEach(function () {
			pluginIframe = document.createElement("iframe");
			pluginIframe.src = "";
			pluginIframe.allowFullscreen = "allowfullscreen";
			body = document.querySelector("body");
			body.appendChild(pluginIframe);

			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
			windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
			iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		});
		afterEach(async function () {
			await windowSocket.terminate();
			await iframeSocket.terminate();
			await new Promise(resolve => setTimeout(resolve, 0));
			await new Promise(resolve => setTimeout(resolve, 0));
			windowSocket = null;
			iframeSocket = null;
			messages.length = 0;
		});

		it("can sendMessage to partner after the right listener set up which is DELETED afterwards", async function () {
			windowSocket.addListener(testWindowSocketOnce, messageCallback, { once: true });
			iframeSocket.addListener(testiframeSocketSocketOnce, messageCallback, { once: true });

			await windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
			await iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);

			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(messageOne);
			expect(messages[1]).toBe(messageTwo);

			windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
			iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(messageOne);
			expect(messages[1]).toBe(messageTwo);
		});

		it("can sendRequest to partner after the right listener set up which is NOT DELETED afterwards", async function () {
			windowSocket.addListener(testWindowSocket, messageCallback);
			iframeSocket.addListener(testiframeSocketSocket, messageCallback);

			await windowSocket.sendRequest(testiframeSocketSocket, messageOne);
			await iframeSocket.sendRequest(testWindowSocket, messageTwo);

			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(messageOne);
			expect(messages[1]).toBe(messageTwo);

			await windowSocket.sendRequest(testiframeSocketSocket, messageOne);
			await iframeSocket.sendRequest(testWindowSocket, messageTwo);

			expect(messages).toHaveLength(4);
			expect(messages[2]).toBe(messageOne);
			expect(messages[3]).toBe(messageTwo);
		});

		it("can send request and get answer from the opposite window object", async function () {
			windowSocket.addListener("hook", (data) => {
				return data + " from the other side.";
			});
			const answer = await iframeSocket.sendRequest("hook", "hello world");

			expect(answer).toBe("hello world" + " from the other side.");

			iframeSocket.addListener("hook", (data) => {
				return data + " from this side.";
			});
			const answer2 = await windowSocket.sendRequest("hook", "hello world");

			expect(answer2).toBe("hello world" + " from this side.");
		});

		it("with a NOT matching type the callback is not fired", async function () {
			windowSocket.addListener(testWindowSocket, messageCallback);
			iframeSocket.addListener(testiframeSocketSocket, messageCallback);

			windowSocket.sendMessage("random-type", messageOne);
			iframeSocket.sendMessage("random-type", messageTwo);

			windowSocket.sendRequest("random-type", messageOne);
			iframeSocket.sendRequest("random-type", messageTwo);

			await new Promise(resolve => setTimeout(resolve, 0));
			expect(messages).toHaveLength(0);
		});

		it("other windowObjects can not send msg", async function () {
			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			addFixEvents(window, window);
			addFixEvents(pluginIframe.contentWindow, pluginIframe.contentWindow);

			pluginIframe.contentWindow.postMessage(JSON.stringify({ type: testiframeSocketSocket, payload: messageOne, msgId: "testMsg" }), "*");

			await new Promise(resolve => setTimeout(resolve, 0));
			expect(messages).toHaveLength(0);

			removeFixEvents(window);
			removeFixEvents(pluginIframe.contentWindow);
			addFixEvents(window, pluginIframe.contentWindow);
			addFixEvents(pluginIframe.contentWindow, window);
		});

		it("return error from hooks", async function () {
			const e = new Error("error happend");
			windowSocket.addListener("error", () => {
				throw e;
			});

			await expect(iframeSocket.sendRequest("error", "hello world")).rejects.toStrictEqual(e);
		});

		it("return text error from hooks, but resolves with it", async function () {
			const e = { error: "error happend" };
			windowSocket.addListener("hook", () => {
				return e;
			});

			await expect(iframeSocket.sendRequest("hook", "hello world")).resolves.toStrictEqual(e);
		});

		it("throw error in a listenerCallback with sendMessage", async function () {
			const e = new Error("error happend");
			windowSocket.addListener("error", () => {
				throw e;
			});
			await expect(iframeSocket.sendMessage("error", "Hello world!")).rejects.toStrictEqual(e);
		});

		it("test terminate function", async function () {
			windowSocket.terminate();
			iframeSocket.terminate();

			await new Promise(resolve => setTimeout(resolve, 0));

			windowSocket.addListener(testWindowSocketOnce, messageCallback, { once: true });
			iframeSocket.addListener(testiframeSocketSocketOnce, messageCallback, { once: true });

			windowSocket.sendMessage(testiframeSocketSocketOnce, messageOne);
			iframeSocket.sendMessage(testWindowSocketOnce, messageTwo);
			// we have to wait after all postMessage since they are implemented as setTimeout in jsdom
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(messages).toHaveLength(0);
		});
		it.todo("when parsing throws arror");
	});
});
