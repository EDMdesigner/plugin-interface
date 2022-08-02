# Chamaileon plugin interface

**This project is a postMessage interface that creates and maintains the communication between window objects**, like a web page and an iframe inside it.

**Chamaileon.io built and maintains this open-source project to provide a secure and standardized way to use its plugins**. We use it in our plugins: email editor, preview, gallery, etc. You can visit our website for more information: [chamaileon.io](https://chamaileon.io).

## Installation and Initialization

```bash
npm i @chamaileon-sdk/plugin-interface
```

The package provides three functions, `initFullscreenPlugin`, `initInlinePlugin` and `providePlugin`.

A plugin initaialization consists of two parts:

- On the parent side, you have to run either `initFullscreenPlugin` or `initInlinePlugin`, based on the usage. The function creates an iframe, and starts loading the plugin based on the src given to it.

- Inside the plugin, you have to call the `providePlugin` function on opening. This function responds to the parent side init mechanisms, and returns the interface.

## Fullscreen plugin

### Initialization
To initialize a fullscreen plugin, you have to call the `initFullscreenPlugin` function with the following parameters:

```js
initFullscreenPlugin(
	{
		data: Object,
		settings: Object,
		hooks: Object,
	},
	{
		id: String,
		src: String,
		parentElem: String | HTMLElement,
		beforeInit: Function,
		timeout: Number,
	}
);
```
**Parameters in the first object**

The parameters in the first object will be sent to the plugin directly.

- **data:** you can pass static data to your plugin.
- **settings:** you can pass down custom settings that modify the look and operation of the plugin.
- **hooks:** you can pass down functions that the plugin will call at certain actions or events.

**Parameters in the second object**

The `initFullscreenPlugin` function creates and iframe based on the `src` provided, and appends it to the `parentElem`. The second parameter object contains information for the library to create the iframe and append it to your application DOM.

- **id:** is the id which will represent the iframe.
- **src:** this is the iframe source as a string.
- **parentElem:** this is a query selector or HTMLElement that you want the plugin iframe to be inserted into. Default is `document.body`
- **beforeInit:** this function will run after the iframe is created and the container and iframe both can be reached inside of this.

	```js
	beforeInit({ container, iframe }) {
		// your code here
	}
	```

- **timeout:** this is a number in milliseconds. This defines how long should the init function wait for an answer from the providePlugin before throwing an error.

### Interface
In the returned object you will get the following properties:
```js
{
	_container: HTMLElement,
	_src: String,
	methods: Object,
	showSplashScreen: Function,
	hideSplashScreen: Function,
	show: Function,
	hide: Function,
	destroy: Function,
}
```
- **_container:** is and HTML element containing the plugin iframe
- **_src:** is the source of the plugin iframe
- **methods:** through the methods object you can reach the plugins declared methods
- **destroy:** this function removes the iframe from the container
#### Splashscreen
If the `settings` param provided in the initialization object contains a `splashScreenUrl`, the plugin will have a separate iframe appended to the container, which you can show and hide with the provided `showSplashScreen` and `hideSplashScreen` functions.
#### Show / Hide
You can show and hide your created plugins with the provided `show` and `hide`. While using these functions, the plugin won`t be destroyed, it will keep its state while hidden.

**Animations**

The `show` can be called with the following parameters:

```js
show({ x = "-100vw", y = "0px", opacity = 0.5, scale = 1, time = 500 })
```
The `show` function provides an easy way to customize your show animation. With the provided parameters, you can set the default hidden state, described by coordinates, opacity, and scale of the plugin, along with the time of the animation. When the function is called, the plugin will move to a fullscreen view from that hidden position. The animation uses the `translate3d` css function. Likewise, the `hide` function moves the plugin back to its set hidden state.

The default hidden state is moved to the left, so the `show` function will move the plugin to view form the left. See the [content editor example](examples/content-editor-example.html) for more configuration.


##  Inline plugin
To initialize an inline plugin, you have to call the `initInlinePlugin` function with the following parameters:

```js
initInlinePlugin(
	{
		data: Object,
		settings: Object,
		hooks: Object,
	},
	{
		src: String,
		container: String | HTMLElement,
		beforeInit: Function,
		timeout: Number,
	}
)
```

**Parameters in the first object**

The parameters in the first object will be sent to the plugin directly.

- **data:** you can pass static data to your plugin.
- **settings:** you can pass down custom settings that modify the look and operation of the plugin.
- **hooks:** you can pass down functions that the plugin will call at certain actions or events.

**Parameters in the second object**

The second object contains information for the library to create the iframe and append it to your application DOM.

- **src:** this is the iframe source as a string.
- **container:** the element you want the plugin to append to.
- **beforeInit:** this function will run after the iframe is created and the container and iframe both can be reached inside of this.

	```js
	beforeInit({ container, iframe }) {
		// your code here
	}
	```

- **timeout:** this is a number in milliseconds. This defines how long should the init function wait for an answer from the providePlugin before throwing an error.

### Interface
In the returned object you will get the following properties:
```js
{
	_container: HTMLElement,
	methods: Object,
	destroy: Function,
}
```
- **_container:** is and HTML element containing the plugin iframe
- **methods:** through the methods object you can reach the plugins declared methods
- **destroy:** this function removes the iframe from the container
## providePlugin
When your plugin is loaded from the provided src, your script in the iframe has to call the `providePlugin` function, in order to respond to the plugin-interface initialization

```js
providePlugin({
	hooks: Array,
	methods: Object,
	validator: Function,
});
```

- **hooks:** This is an array of hook names that the plugin accepts and uses
- **methods:** These are functions can be called from outside and are used to interact directly with the plugin from the outside
- **validator:** Is a function that will run when the provided `data`, `settings` and `hooks` arrive from the parent side
### Interface
The providePlugin function should resolve to an object containing these fields:
```js
{
	data: Object,
	settings: Object,
	hooks: Object,
	terminate: Function,
}
```
- **data:** The data that was sent at the init stage
- **settings:** The settings that were sent at the init stage
- **hooks:** Hooks that were sent at the init stage and were filtered with the list of hooks that are accepted by the plugin
- **terminate:** A function designed to terminate the communication between the window objects.

### Update hooks
The updateHooks method can be defined in the plugin side. It can be used to update the hooks that were defined on initialization. We provide two options that you can see on the example below.

Starting context:
```js
const onSave = () => {};
const onDelete = () => {};
const onFail = () => {};

const activeHooks = [];

const pluginInterface = await initFullscreenPlugin(...);
// For this example let's say that we sent
// the "onFail" hook with the init function

const pluginInstance = await providePlugin({
	hooks: ["onSave", "onDelete", "onFail" ],
	methods: {
		updateHooks(hooks) {
			activeHooks = hooks;
		},
	},
	validator: () => {},
})

pluginInstanceMethods.updateHooks = (hooks) => {
	activeHooks = hooks;
}
```

Update the hooks while keeping the already defined ones:
```js
await pluginInterface.methods.updateHooks({ hooks: { onSave } });
// after the method call the activeHooks should be equal with ["onSave", "onFail", "error"];
```

Update the hooks and only keep the new ones:
```js
await pluginInterface.methods.updateHooks({ hooks: { onDelete }, resetHooks: true });
// after the method call the activeHooks should be equal with ["onDelete", "error"];
```

### Example

You can run the [examples](examples), with static server
```js
$ npm -g install static-server
$ static-server -c "*" -zp 8080
```
