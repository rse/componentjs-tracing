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
            var self = this

            cs(self).register('parseLogfile', function (content) {
                return window.tupleParser.parseLog(content)
            })

            cs(self).register('parseConstraintset', function (content) {
                try {
                    var constraintSet = window.constraint_parser.parse(content)
                    return {
                        success: true,
                        constraints: constraintSet
                    }
                } catch (err) {
                    return {
                        success: false,
                        error: err
                    }
                }
            })

            cs(self).register('checkTuples', function (tuples, constraintSet) {
                var resTuples = []

                for (var i = 0; i < tuples.length; i++) {
                    var tuple = window.constraintChecker.checkTuple(constraintSet, tuples[i])
                    if (tuple.result === 'UNCLASSIFIED' || tuple.result === 'FAIL') {
                        resTuples.push(tuple)
                    }
                }

                return resTuples
            })
        }
    }
})