/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 *  This is a small ComponentJS plug-in which sends all
 *  captured traces to the server using websockets.
 */

/* global ComponentJS:false */
/* global alert:false, io:false, unescape:false */
/* jshint unused:false */

ComponentJS.plugin("tracing-remote", function (_cs, $cs, GLOBAL) {
    /*  connect to the server to drop recorded traces  */
    var websocket = io.connect("http://{{addr}}:{{port}}")

    /*  ensure the tracing plugin is present  */
    if (!$cs.plugin("tracing"))
        throw _cs.exception("plugin:tracing-remote", "sorry, required 'tracing' plugin not found")

    /*  enable remote execution of ComponentJS commands  */
    websocket.on("cmd", function (req) {
        eval(unescape(req))
    })

    /*  notify the developer, when the websocket connection is re-established  */
    websocket.on("reconnect", function () {
        alert("Re-established connection with debugging server!")
    })

    /*  notify the developer, when the websocket connection to the debugging server is lost  */
    websocket.on("disconnect", function () {
        alert("Lost connection to the debugging server!")
    })

    /*  log the tracing information to the console  */
    _cs.latch("ComponentJS:tracing", function (trace) {
        if (   typeof GLOBAL.console     !== "undefined" &&
               typeof GLOBAL.console.log !== "undefined") {

            /*  stringify component name or path  */
            var nameofcomp = function (comp) {
                if      (comp === _cs.none || comp === null) comp = "<none>"
                else if (comp === _cs.internal) comp = "<internal>"
                else                            comp = comp.path("/")
                return comp
            }
            var source = nameofcomp(trace.source())
            var origin = nameofcomp(trace.origin())

            /*  stringify component type(s)  */
            var typeofcomp = function (type) {
                var txt = ""
                if (type.view)       txt += "V"
                if (type.model)      txt += "M"
                if (type.controller) txt += "C"
                if (type.service)    txt += "S"
                if (txt === "")      txt =  "-"
                return txt
            }
            var sourceType = typeofcomp(trace.sourceType())
            var originType = typeofcomp(trace.originType())

            var seen = []
            var params = JSON.stringify(trace.parameters(), function(key, val) {
               if (typeof val === "object") {
                    if (seen.indexOf(val) >= 0)
                        return
                    seen.push(val)
                }
                return val
            })

            /*  create transferable trace object  */
            var trace = {
                id: trace.id,
                time: trace.timestamp(),
                source: source,
                sourceType: sourceType,
                origin: origin,
                hidden: trace.hidden,
                originType: originType,
                operation: trace.operation(),
                parameters: JSON.parse(params)
            }

            /*  send the new trace to the server  */
            websocket.emit("trace", trace)
        }
    })
})
