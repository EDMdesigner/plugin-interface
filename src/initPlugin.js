import PostMessageSocket from "./postMessageSocket.js";

function validateConfig({ settings, hooks }, config) {
    // settings validation is quite hard, we would need a full-fledged json/object-tree validation
}

export default function initPlugin({ container, src, data = {}, settings = {}, hooks = {} }, { timeout = 5000, beforeInit } = {}) {
    const pluginIframe = document.createElement("iframe");
	pluginIframe.src = src;
	pluginIframe.allowFullscreen = "allowfullscreen";

    if (typeof beforeInit === "function") {
        beforeInit({ container, iframe: pluginIframe })
    }

	container.appendChild(pluginIframe);

    const socket = new PostMessageSocket(window,  pluginIframe.contentWindow);

    return new Promise((resolve, reject) => {
        socket.addListener("domReady", onDomReady, { once: true });

        async function onDomReady(payload) {
			
            validateConfig({ settings, hooks }, payload.config)
            await socket.request("init", { data, settings, hooks: Object.keys(hooks) }, { timeout });
            listenForRequests();

            const methodNames = payload.config.methods;

            const methods = methodNames.reduce((methods, methodName) => {
                return {
                    ...methods,
                    [methodName]: async (payload) => {
                        if (!methodNames.includes(methodName)) {
                            throw new Error(`Naughty boy! Don't request ${type}!`);
                        }

                        return socket.request(methodName, payload);
                    }
                }
            }, {})

            async function listenForRequests() {
                Object.keys(hooks).forEach((hookName) => {
                    socket.addListener(hookName, payload => hooks[hookName](payload));
                });
            }

            resolve({
                _container: container,
                _iframe: pluginIframe,
                methods,
            })
        }
    });
}