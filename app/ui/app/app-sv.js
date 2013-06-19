/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.sv = cs.clazz({
    mixin: [ cs.marker.service ],
    protos: {
        create: function () {
            /*  converts a string containing multiple traces into an array of trace objects  */
            cs(this).register("parseLogfile", function (content) {
                return app.lib.tupleParser.parseLog(content)
            })

            /*  parses a given string using the PEG parser for the constraint grammar  */
            cs(this).register("parseConstraintset", function (content) {
                try {
                    var constraintSet = app.lib.constraint_parser.parse(content)
                    return { success: true, constraints: constraintSet }
                }
                catch (err) {
                    return { success: false, error: err }
                }
            })

            /*  checks an array of traces against a given set of constraints  */
            cs(this).register("checkTuples", function (traces, constraintSet) {
                var resTraces = []
                for (var i = 0; i < traces.length; i++) {
                    var tuple = app.lib.constraintChecker.checkTuple(constraintSet, traces[i])
                    if (tuple.result === "UNCLASSIFIED" || tuple.result === "FAIL")
                        resTraces.push(tuple)
                }
                return resTraces
            })
        }
    }
})