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
 *  captured tracing tuples to the console.
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
                if      (comp === _cs.none)     comp = "<none>";
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

            /*  stringify parameters  */
            var params = "";
            var p = tracing.parameters();
            for (var name in p) {
                if (params !== "")
                    params += ", ";
                params += name + ": " + JSON.stringify(p[name]);
            }
            if (params !== "")
                params = "{ " + params + " }";
            else
                params = "{}";

            /*  print the tracing tuple to the console  */
            GLOBAL.console.log("TRACING: " +
                "#" + tracing.id + ": < " +
                tracing.timestamp() + ", " +
                source + ", " +
                sourceType + ", " +
                origin + ", " +
                originType + ", " +
                tracing.operation() + ", " +
                params + " >"
            );
        }
    });
});