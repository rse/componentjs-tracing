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

            /*  parses a given string using the PEG parser for the temporal constraint grammar  */
            cs(this).register("parseTemporalConstraintset", function (content) {
                try {
                    var constraintSet = app.lib.temporal_constraint_parser.parse(content)
                    return { success: true, constraints: constraintSet }
                }
                catch (err) {
                    return { success: false, error: err }
                }
            })

            /*  validates the given constraints semantically  */
            cs(this).register("validateTemporalConstraints", function (constraintSets) {
                _.map(constraintSets, function (constraintSet) {
                    _.map(constraintSet, function (constraint) {
                        var participants = constraint.constraintBody.sequence
                        _.map(constraint.constraintBody.filters, function (filter) {
                            if (_.indexOf(participants, filter.id) === -1)
                                return { success: false, error: { row: 1, column: 0, text: filter.id + " is not defined in the sequence section but used in a filter expression", type: "error" } }
                        })
                        _.map(constraint.constraintBody.links, function (link) {
                            if (_.indexOf(participants, link.id) === -1)
                                return { success: false, error: { row: 1, column: 0, text: link.id + " is not defined in the sequence section but used in a link expression", type: "error" } }
                        })
                        //TODO - enforce invariants
                    })
                })
            })

            /*  checks an array of traces against a given set of constraints  */
            cs(this).register("checkTuples", function (traces, constraintSet) {
                var resTraces = []
                _.map(traces, function (trace) {
                    var mTrace = app.lib.constraintChecker.checkTuple(constraintSet, trace)
                    if (mTrace.result === "UNCLASSIFIED" || mTrace.result === "FAIL")
                        resTraces.push(mTrace)
                })
                return resTraces
            })
        }
    }
})