/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var monitor = function (temporalConstraint) {

    var self = this
    this.temporalConstraint = temporalConstraint
    this.sequence = temporalConstraint.constraintBody.sequence
    this.filters = {}
    this.buffer = {}
    this.link = temporalConstraint.constraintBody.link

    var isLast = function (participant) {
        return _.findIndex(self.sequence, function (part) { return part === participant }) === (self.sequence.length - 1)
    }
    _.each(temporalConstraint.constraintBody.filters, function (filter) {
        this.filters[filter.id] = filter
    }, this)

    _.each(this.sequence, function (participant) {
        if (!isLast(participant))
            this.buffer[participant] = []
    }, this)

    var predIsAvailable = function (current) {
        var idx = _.findIndex(self.sequence, function (participant) { return participant === current })
        for (var i = idx - 1; i >= 0; i--)
            if (self.buffer[self.sequence[i]].length === 0)
                return false
        return true
    }

    var cartesian = function (arrays, callback) {
        var result = [], max = arrays.length - 1
        var finished = false
        function helper (acc, i) {
            if (finished)
                return
            for (var x = 0; x < arrays[i].length; x++) {
                var newAry = acc.slice(0)
                newAry.push(arrays[i][x])
                if (i === max) {
                    if (callback(newAry)) {
                        finished = true
                        break;
                    }
                }
                else
                    helper(newAry, i + 1)
            }
        }

        helper([], 0)
        return result
    }

    var checkLink = function (trace) {
        var found = false
        var bags = _.values(self.buffer)
        cartesian(bags, function (permutation) {
            var ctx = {}
            _.each(permutation, function (trace) {
                ctx[trace.member] = trace
            })
            ctx[_.last(self.sequence)] = trace
            if (trace.evaluateExpr(self.link.condition, ctx)) {
                found = true
                return false
            }
        })
        return found
    }

    this.processTerminate = function (trace) {
        var result = []
        var filter = this.filters[this.sequence[this.sequence.length - 1]]
        var res = trace.evaluateExpr(filter.condition)
        if (res) {
            if (_.filter(self.buffer, function (buf) { return buf.length !== 0 }).length === 0)
                return
            if (!predIsAvailable(filter.id) || (isLast(filter.id) && !checkLink(trace))) {
                _.forIn(self.buffer, function (value) {
                    _.each(value, function (tr) {
                        tr.checks = [{
                            constraint: temporalConstraint,
                            subs: [],
                            result: 'FAIL'
                        }]
                        result.push(tr)
                    })
                })
            }
        }

        return result
    }

    this.processTrace = function (trace) {
        var result = null
        /*  push each trace to the matching filters bag  */
        _.each(this.filters, function (filter) {
            var res = trace.evaluateExpr(filter.condition)
            if (res) {
                if (!predIsAvailable(filter.id) || (isLast(filter.id) && !checkLink(trace))) {
                    trace.checks = [{
                        constraint: temporalConstraint,
                        subs: [],
                        result: 'FAIL'
                    }]
                    result = trace
                    return false
                }
                else {
                    if (!isLast(filter.id)) {
                        trace.member = filter.id
                        this.buffer[filter.id].push(trace)
                    }
                }
            }
        }, this)

        return result
    }
}

app.lib.happens_before_monitor = monitor

})()