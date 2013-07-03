# ComponentJS Tracing

Run-Time Tracing for ComponentJS

## Overview

This is a [Node.js](http://nodejs.org/) based tracing
application to support development with [ComponentJS](http://componentjs.com/),
a powerful Component System for hierarchically structuring the
User-Interface dialogs of complex HTML5-based Rich Clients
([SPA](http://en.wikipedia.org/wiki/Single-page_application)).

The ComponentJS Tracing application consists of three major components:

* A forwarding proxy service for instrumenting the target ComponentJS application 
* A Websocket service for routing the tracing information between the target ComponentJS application and the tracing UI.
* An origin webserver delivering a tracing UI for collecting the tracing information, provisioning constraint sets and
  applying constraint sets once or continuously against the tracing information.

## Screenshots

<img src="https://raw.github.com/rse/componentjs-tracing/master/doc/screenshot-tracing.png" width="100%"/><br/>
<img src="https://raw.github.com/rse/componentjs-tracing/master/doc/screenshot-checking.png" width="100%"/><br/>
<img src="https://raw.github.com/rse/componentjs-tracing/master/doc/screenshot-constraints.png" width="100%"/><br/>

## Architecture

The diagram below illustrates the underlying architecture of the ComponentJS tracing application.

![Architecture](https://raw.github.com/rse/componentjs-tracing/master/doc/architecture.png)

**Links:**

* [User Interface](app/ui#user-interface-spa)
* [Server Module](app/sv#websocket-server-module)
* [Plug-ins](app/sv/proxy.d/plugins#componentjs-plug-ins)
* [Transpiler](app/sv/proxy.d/transpiler#transpiler)

## Installation

1. Install [Node.js](http://nodejs.org/)
2. Use Node.js's [NPM](https://npmjs.org/) to install ComponentJS Tracing:

        $ npm install -g componentjs-tracing

## Update Existing Installation

    $ npm update -g componentjs-tracing

## Usage

	$ component-tracing [options]

The following command-line options can either be supplied on the
command line or in the included [server.ini](server.ini) file.

* **--version:** Print tool version and exit
* **--help, -h:** Print this help and exit
* **--addr, -a:** IP address to listen
* **--port, -p:** TCP port to listen
* **--backlog, -b:** TCP socket connection backlog
* **--componentjs, --cjs:** Regex matching the url of the ComponentJS file
* **--components, --cmps:** Regex matching the urls of the components files of the SPA
* **--proxyaddr, -A:** IP address to bind to
* **--proxyport, -P:** TCP port to listen in on
* **--latestcjs, --lcjs:** Overwrites applications ComponentJS file with the supplied version
* **--proxyfwd, -F:** Host and port of forwarding proxy (eg when you are behind a corporate proxy)
* **--config=&lt;cfg&gt;:** Adds the specified section of the ini file to overwrite defaults
* **--runfile, -rf:** Directs the traces to a separate runfile bypassing the websocket logic and thus the user interface

## Limitations

The ComponentJS Tracing application can only be used in combination with the [Google Chrome](http://www.google.com/chrome/) browser,
because we had to use Chrome-specific functionalities:

* Inspecting the stacktrace is necessary for the [tracing plug-in](app/sv/proxy.d/plugins#componentjs-plug-ins).
* CSS dimension calculation is based on the [calc](http://caniuse.com/calc) method.
* Native Websockets are used since we don't want to provide any ugly Flash fallbacks.
* HTML5 FileReader API is used.

## License

Copyright (c) 2013 Ralf S. Engelschall (http://engelschall.com)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a [copy](LICENSE) of the MPL was not distributed with this file.
You can obtain one at http://mozilla.org/MPL/2.0/.

## Authors

* Ralf S. Engelschall (rse@engelschall.com)
* Christian Vaas (christianvaas@auspex.eu)

