#ComponentJS Tracing Proxy

Tracing Reverse proxy for ComponentJS Development Support

##Overview

This is a [Node.js](http://nodejs.org/) based reverse proxy
to support development with [ComponentJS](http://componentjs.com/),
a powerful Component System for hierarchically structuring the
User-Interface (UI) dialogs of complex HTML5-based Rich Clients ([SPA](http://en.wikipedia.org/wiki/Single-page_application)s).

##Installation

###Prerequisites

* [Node.js](http://nodejs.org/)
* [NPM](https://npmjs.org/)
* Obtain a copy of this repository either by downloading the [zip](/archive/master.zip) file or cloning via [git](http://git-scm.com/)

###Installing dependencies

Execute the package file. It will install or update the necessary node modules.
* **Windows:** package.bat
* **Linux/Cygwin:** package.sh

##Usage

###Basic Usage
	node server.js

###Advanced Usage
	node server.js [options] [arguments]
The following options can either be supplied via the included [server.ini](server.ini) file or the
command line.  
*Note: Options need to be prefixed with two dashes*

* **version:** Print tool version and exit
* **help, h:** Print this help and exit
* **addr, a:** IP address to listen
* **port, p:** TCP port to listen
* **backlog, b:** TCP socket connection backlog
* **componentjs, cjs:** Regex matching the url of the ComponentJS file
* **components, cmps:** Regex matching the urls of the components files of the SPA
* **proxyaddr, A:** IP address to bind to
* **proxyport, P:** TCP port to listen in on
* **latestcjs, lcjs:** Overwrites applications ComponentJS file with the supplied version
* **proxyfwd, F:** Host and port of forwarding proxy
* **config=&lt;cfg&gt;:** Adds the specified section of the ini file to overwrite defaults

##License

Copyright (c) 2013 Ralf S. Engelschall (http://engelschall.com)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a [copy](LICENSE) of the MPL was not distributed with this file.
You can obtain one at http://mozilla.org/MPL/2.0/.

##Authors

- Ralf S. Engelschall (rse@engelschall.com)
- Christian Vaas (christianvaas@auspex.eu)