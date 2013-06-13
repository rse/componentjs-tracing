This server module handles the websocket based communication with
the analysis SPA and the [remote plug-in](../../plugins)  
It basically provides two websocket endpoints
* **join** issued when a socket wants to subscribe to incoming traces
* **trace** issued when a socket wants to drop a new trace