# Chamaileon plugin interface

**This is a postMessage interface that creates and maintains the communication between window objects**, like a web page and an iframe inside it.

**Chamaileon.io built and maintains this open-source project to provide a secure and standardized way to use its plugins**. We use it in our plugins: email editor, preview, gallery, etc. You can visit our website for more information: [chamaileon.io](https://chamaileon.io).

## Installation

```bash
npm i chamaileon-sdk/plugin-interface
```

After installation you can use two functions, `initFullscreenPlugin` and `initInlinePlugin`, to start initializing the interface. From the created Iframe you have to run the providePlugin function to complete the initialization.

The initialized plugin interface can provide a way to communicate with an application running in an iframe. You can update its content or get information from it. This way connect any front and application with any backend solution.

## initFullscreenPlugin and initInlinePlugin

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
);
```

```js
initFullscreenPlugin(
	{
		data: Object,
		settings: Object,
		hooks: Object,
	{
		id: String,
		src: String,
		parentElem: String | HTMLElement,
		beforeInit: Function,
		timeout: Number,
	}
);
```

To initialize the plugin you have to invoke one of the functions above.

#### Parameters in the first object

The parameters in the first object will be sent to the plugin directly.

- **data:** you can pass static data that will be rendered in the plugin.

- **settings:** you can pass down custom settings that modify the look and operation of the plugin.

- **hooks:** you can pass down functions that the plugin will call at certain actions or events.

#### Parameters in the second object

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

- **id:** is the id which will represent the iframe.

- **parentElem:** is a query selector or HTMLElement that you want the plugin to be inserted into. Default is `document.body`

## providePlugin

```js
providePlugin({
	hooks: Array,
	methods: Object,
	validator: Function,
});
```

You have to invoke the providePlugin inside the iframe and this will respond to the init function that created the iframe.

#### Parameters

- **hooks:** This is an array of hook names that the plugin accepts and uses

- **methods:** These are functions can be called from outside and are used to interact directly with the plugin from the outside

## After a successful init

### Init side

The init functions should resolve to an object containing these fields:

- **methods:** Contains the methods that are provided by the plugin.
- **terminate:** A function designed to terminate the communication between the window objects.

### Plugin side

The providePlugin function should resolve to an object containing these fields:

- **data:** The data that was sent at the init stage
- **settings:** The settings that were sent at the init stage
- **hooks:** Hooks that were sent at the init stage and were filtered with the list of hooks that are accepted by the plugin
- **terminate:** A function designed to terminate the communication between the window objects.
