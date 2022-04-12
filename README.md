# Chamaileon plugin interface

**This is a postMessage interface for communication between object windows**, like a web page and an iframe inside it. 

**Chamaileon.io built and maintains this open-source project to provide a secure and standardized way to use its plugins**, the email editor, preview, gallery etc. To check out our webpage visit [chamaileon.io](https://chamaileon.io).
## Installation

`npm i chamaileon-sdk/plugin-interface`


After installation you can use two functions, “initFullscreenPlugin” and “initInlinePlugin“, to start initializing the interface. From the created Iframe you have to run the providePlugin function to complete the initialisation. 

The initialised plugin interface can provide a way to communicate with an application running in an iframe. Update its content, and get information from it. This way connect any front and application with any backend solution.


## “initFullscreenPlugin” and “initInlinePlugin“. 

initInlinePlugin({ data: Object, settings: Object, hooks: Object }, { src: String, container: String | HTMLElement, beforeInit: Function, timeout: Number })

`initFullscreenPlugin({ data: Object, settings: Object, hooks: Object }, { id: String, src: String, parentElem: String | HTMLElement, beforeInit: Function, timeout: Number });`

To initialize the plugin you have to invoke one of the functions above. The first object you have to pass to the functions will be passed to the plugin. 

## initInlinePlugin and initFullscreenPlugin 

On the **data** and **settings** fields, you can pass down any information to the plugins. 

**hooks** object contains the functions the plugin can invoke when certain events happen. 

The second object contains information for the library to create the iframe and append it to your application DOM. 

- src: Src is the iframe source as a string. Container the element you want the plugin to append to. beforeInit function will run after the iframe is created and the container and iframe both can be reached inside of it. 

- beforeInit({container, iframe}) {
	// your code here
}

- timeout is a number in milliseconds after the init functions throw an error if no answer arrives from the providePlugin.

- id: is the container id you want to add. 

- parentElem: query selector or HTMLElement you want to append the plugin. Default is “document.body”


providePlugin

`providePlugin({ hooks: Array,  methods: Object, validator: Function });`

As an answer from inside the iframe, you have to invoke the providePlugin function. This contains the hooks array which contains the function names the init functions can use in their hooks object. 

The methods are functions too, but they provided from the plugin side, and these are the functions that are can be called from outside.

After the setup, the init functions resolve to a plugin interface object with 2 fields:
- methods: Contains the methods that can be called. 
- terminate: A function designed to terminate the communication between the window objects. 

ProvidePluigin Resolves to an object contains 
- data,
- settings,
- hooks: hookFunctions,
- terminate
