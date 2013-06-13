#ComponentJS Tracing Proxy

Tracing Reverse proxy for ComponentJS Development Support

##Overview

This is a [Node.js](http://nodejs.org/) based reverse proxy
to support development with [ComponentJS](http://componentjs.com/),
the powerful Component System for hierarchically structuring the
User-Interface (UI) dialogs of complex HTML5-based Rich Clients (aka
Single-Page-Apps).

##Installation

FIXME

##Configuration
The following options can either be supplied via the included [server.ini](server.ini) file or the
command line.

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
* **config=<cfg>:** Adds the specified section of the ini file to overwrite defaults

##License

Copyright (c) 2013 Ralf S. Engelschall (http://engelschall.com)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with file
this, You can obtain one at http://mozilla.org/MPL/2.0/.

##Authors

- Ralf S. Engelschall (rse@engelschall.com)
- Christian Vaas (christianvaas@auspex.eu)