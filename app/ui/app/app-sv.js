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
            cs(this).register('parseLogfile', function (content) {
                return app.lib.traceParser.parseLog(content)
            })

            /*  parses a given string using the PEG parser for the constraint grammar  */
            cs(this).register('parseConstraintset', function (content) {
                try {
                    var constraintSet = app.lib.peephole_constraint_parser.parse(content)
                    return { success: true, constraints: constraintSet }
                }
                catch (err) {
                    return { success: false, error: err }
                }
            })

            /*  parses a given string using the PEG parser for the temporal constraint grammar  */
            cs(this).register('parseTemporalConstraintset', function (content) {
                try {
                    var constraintSet = app.lib.temporal_constraint_parser.parse(content)
                    return { success: true, constraints: constraintSet }
                }
                catch (err) {
                    return { success: false, error: err }
                }
            })

            /*  validates the given constraints semantically  */
            cs(this).register('validateTemporalConstraints', function (constraintSet) {
                var result = []
                var noDups = _.uniq(constraintSet, function (constraint) { return constraint.id })
                if (noDups.length !== constraintSet.length) {
                    var diff = _.difference(constraintSet, noDups)
                    _.each(diff, function (constraint) {
                        result.push({
                            constraint: constraint,
                            column: 0,
                            type: 'error',
                            message: 'Found another constraint with the id "' + constraint.id + '", the id of a constraint has to be unique'
                        })
                    })
                }
                _.map(constraintSet, function (constraint) {
                    var participants = constraint.constraintBody.sequence
                    if (participants.length > 2)
                        result.push({
                            constraint: constraint,
                            column: 0,
                            type: 'error',
                            message: 'The number of participating traces of a temporal constraint must no exceed two'
                        })
                    var noDups = _.uniq(participants)
                    if (noDups.length !== 2)
                        result.push({
                            constraint: constraint,
                            column: 0,
                            type: 'error',
                            message: 'There have to be exactly two diversely named members in the sequence of a temporal constraint'
                        })
                    _.map(participants, function (participant) {
                        var filterIds = _.map(constraint.constraintBody.filters, function (filter) { return filter.id })
                        if (_.indexOf(filterIds, participant) === -1)
                            result.push({
                                constraint: constraint,
                                column: 0,
                                type: 'warning',
                                message: 'There is no filter expression specified for ' + participant
                            })
                    })
                    _.map(constraint.constraintBody.filters, function (filter) {
                        if (_.indexOf(participants, filter.id) === -1)
                            result.push({
                                constraint: constraint,
                                column: 0,
                                type: 'error',
                                message: filter.id + ' is not defined in the sequence section but used in a filter expression'
                            })
                    })
                    if (constraint.constraintBody.links.length > 1)
                        result.push({
                            constraint: constraint,
                            column: 0,
                            type: 'error',
                            message: 'There can only be a link expression for the second participating trace'
                        })
                    _.map(constraint.constraintBody.links, function (link) {
                        if (_.indexOf(participants, link.id) === -1)
                            result.push({
                                constraint: constraint,
                                column: 0,
                                type: 'error',
                                message: link.id + ' is not defined in the sequence section but used in a link expression'
                            })
                    })
                })

                return result
            })

            /*  validates the given constraints semantically  */
            cs(this).register('validatePeepholeConstraints', function (constraintSet) {
                var result = []
                var noDups = _.uniq(constraintSet, function (constraint) { return constraint.id })
                // TODO - also take into account the nested character of peephole constraints, when checking for uniqueness
                if (noDups.length !== constraintSet.length) {
                    var diff = _.difference(constraintSet, noDups)
                    _.each(diff, function (constraint) {
                        result.push({
                            constraint: constraint,
                            column: 0,
                            type: 'error',
                            message: 'Found another constraint with the id "' + constraint.id + '", the id of a constraint has to be unique'
                        })
                    })
                }

                return result
            })

            /*  checks an array of traces against a given set of constraints  */
            cs(this).register('checkTraces', function (traces, constraintSet) {
                var resTraces = []
                _.map(traces, function (trace) {
                    var mTrace = app.lib.constraintChecker.checkTrace(constraintSet, trace)
                    if (mTrace.result === 'UNCLASSIFIED' || mTrace.result === 'FAIL')
                        resTraces.push(mTrace)
                })
                return resTraces
            })
        }
    }
})