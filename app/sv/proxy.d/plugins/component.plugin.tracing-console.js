/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 *  This is a small ComponentJS plugin which just logs all
 *  captured traces to the console.
 */

/* global ComponentJS:false */
/* jshint unused:false */

ComponentJS.plugin("tracing-console", function (_cs, $cs, GLOBAL) {
    /*  ensure the tracing plugin is present  */
    if (!$cs.plugin("tracing"))
        throw _cs.exception("plugin:tracing-console", "sorry, required 'tracing' plugin not found");

    /*  log the tracing information to the console  */
    _cs.latch("ComponentJS:tracing", function (tracing) {
        if (   typeof GLOBAL.console     !== "undefined"
            && typeof GLOBAL.console.log !== "undefined") {

            /*  stringify component name or path  */
            var nameofcomp = function (comp) {
                if      (comp === _cs.none || comp === null) comp = "<none>";
                else if (comp === _cs.internal) comp = "<internal>";
                else                            comp = comp.path("/");
                return comp;
            };
            var source = nameofcomp(tracing.source());
            var origin = nameofcomp(tracing.origin());

            /*  stringify component type(s)  */
            var typeofcomp = function (type) {
                var txt = "";
                if (type.view)       txt += "V";
                if (type.model)      txt += "M";
                if (type.controller) txt += "C";
                if (type.service)    txt += "S";
                if (txt === "")      txt =  "-";
                return txt;
            };
            var sourceType = typeofcomp(tracing.sourceType());
            var originType = typeofcomp(tracing.originType());
            var stringify = function (obj) {
                var seen = []
                return JSON.stringify(obj, function(key, val) {
                   if (typeof val === "object") {
                        if (seen.indexOf(val) >= 0)
                            return
                        seen.push(val)
                    }
                    return val
                })
            }

            /*  print the trace to the console  */
            GLOBAL.console.log("TRACING: " +
                "#" + tracing.id + ": < " +
                tracing.id + ", " +
                tracing.timestamp() + ", " +
                source + ", " +
                sourceType + ", " +
                origin + ", " +
                originType + ", " +
                tracing.operation() + ", " +
                stringify(tracing.parameters()) + " >"
            );
        }
    });
});