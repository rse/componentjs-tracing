/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 *  This is a small ComponentJS plugin which sends all
 *  captured traces to the server using websockets.
 */

/* global ComponentJS:false */
/* global io:false */
/* jshint unused:false */

ComponentJS.plugin("tracing-remote", function (_cs, $cs, GLOBAL) {
    /*  connect to the server to drop recorded traces  */
    var websocket = io.connect("http://{{addr}}:{{port}}")

    /*  ensure the tracing plugin is present  */
    if (!$cs.plugin("tracing"))
        throw _cs.exception("plugin:tracing-remote", "sorry, required 'tracing' plugin not found")

    /*  log the tracing information to the console  */
    _cs.latch("ComponentJS:tracing", function (tracing) {
        if (   typeof GLOBAL.console     !== "undefined" &&
               typeof GLOBAL.console.log !== "undefined") {

            /*  stringify component name or path  */
            var nameofcomp = function (comp) {
                if      (comp === _cs.none || comp === null) comp = "<none>"
                else if (comp === _cs.internal) comp = "<internal>"
                else                            comp = comp.path("/")
                return comp
            }
            var source = nameofcomp(tracing.source())
            var origin = nameofcomp(tracing.origin())

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
            var sourceType = typeofcomp(tracing.sourceType())
            var originType = typeofcomp(tracing.originType())

            var seen = []
            var params = JSON.stringify(tracing.parameters(), function(key, val) {
               if (typeof val === "object") {
                    if (seen.indexOf(val) >= 0)
                        return
                    seen.push(val)
                }
                return val
            })

            /*  create transferable trace object  */
            var trace = {
                id: tracing.id,
                time: tracing.timestamp(),
                source: source,
                sourceType: sourceType,
                origin: origin,
                originType: originType,
                operation: tracing.operation(),
                parameters: JSON.parse(params)
            }

            /*  send the new trace to the server  */
            websocket.emit("trace", trace)
        }
    })
})
