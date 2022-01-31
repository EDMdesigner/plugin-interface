import PostMessageSocket from "../../src/postMessageSocket";
import providePlugin from "../../src/providePlugin";

// workaround for https://github.com/jsdom/jsdom/issues/2745
// if no origin exists, replace it with the right targetWindow
function fixEvents(currentWindow, targetWindow, event) {	
	if (!event.origin ||event.origin === '' || event.origin === null) {
		event.stopImmediatePropagation();
		const eventWithOrigin = new MessageEvent('message', {
			data: event.data,
			origin: targetWindow,
			source: targetWindow
		});
		currentWindow.dispatchEvent(eventWithOrigin);
	}
}

let fixEventsBinded;
function addFixEvents(currentWindow, targetWindow) {
	fixEventsBinded = fixEvents.bind(null, currentWindow, targetWindow);
	currentWindow.addEventListener('message', fixEventsBinded);
}

function removeFixEvents(windowObject) {
	windowObject.removeEventListener('message', fixEventsBinded);
}

describe("providePlugin",() => {
    let pluginIframe;
    let body;
    let windowSocket;
    let iframeSocket;

    beforeAll(function () {
		pluginIframe = document.createElement("iframe");
		pluginIframe.src = "";
		pluginIframe.allowFullscreen = "allowfullscreen";
		body = document.querySelector("body");
		body.appendChild(pluginIframe);

		windowSocket = new PostMessageSocket(window, pluginIframe.contentWindow);
		addFixEvents(window, pluginIframe.contentWindow)

		iframeSocket = new PostMessageSocket(pluginIframe.contentWindow, window);
		addFixEvents(pluginIframe.contentWindow, window)
	});

    it.todo("throws proper errors on improper data");
    it.todo("with proper data, sends domready, throws error if not getting init call");
    it("with proper data, init properly", async () => {
        const timeout = 5000;
        const hooks = {
            testHook: () => { console.log("testhook") }
        };
        const data = {
            title: "testTitle",
            description: "testDescription"
        };
        const settings = {
            background: "#abcdef"
        };

        function updateData(newData) {
            data.title = newData.title;
            data.description = newData.description;

            document.getElementById("title").value = data.title;
            document.getElementById("description").value = data.description;
        }

        function updateSettings(newSettings) {
            settings.background = newSettings.background;

            document.body.style.background = settings.background;
        }

        windowSocket.addListener("domReady", onDomReady, { once: true });

        async function onDomReady(payload) {

            console.log("HERE");
			

            await windowSocket.sendRequest("init", { data , settings, hooks: Object.keys(hooks) }, { timeout });
        };
        
        const iface = await providePlugin({
            settings,
            hooks: ["onResetButtonClicked", "onSaveButtonClicked", "onClose"],
            methods: {
                updateData,
                updateSettings
            }
        }, iframeSocket);

        console.log("iframe");
        console.log(iface);
        
        expect(true).toBe(true);
    });   
});