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
    this.links = {}
    this.filters = {}
    this.buffer = {}

    _.each(temporalConstraint.constraintBody.filters, function (filter) {
        this.filters[filter.id] = filter
    }, this)

    _.each(temporalConstraint.constraintBody.links, function (link) {
        this.links[link.id] = link
    }, this)

    _.each(this.sequence, function (participant) {
        this.buffer[participant] = []
    }, this)

    var predIsAvailable = function (current) {
        var idx = _.findIndex(self.sequence, function (participant) { return participant === current })
        if (idx === 1 && self.buffer[self.sequence[0]].length === 0)
            return false
        return true
    }

    var checkLink = function (link, trace) {
        var found = false
        _.each(self.buffer[self.sequence[0]], function (t) {
            var ctx = {}
            ctx[self.sequence[0]] = t
            ctx[link.id] = trace
            if (trace.evaluateExpr(link.condition, ctx)) {
                found = true
                return false
            }
        }, this)
        return found
    }

    this.processTrace = function (trace) {
        var result
        /*  push each trace to the matching filters bag  */
        _.each(this.filters, function (filter) {
            var res = trace.evaluateExpr(filter.condition)
            if (res) {
                var link = this.links[filter.id]
                if (!predIsAvailable(filter.id) || (link && !checkLink(link, trace))) {
                    trace.checks = [{
                        constraint: temporalConstraint,
                        subs: [],
                        result: 'FAIL'
                    }]
                    result = trace
                    return false
                }
                else
                    this.buffer[filter.id].push(trace)
            }
        }, this)

        return result
    }
}

app.lib.happens_before_monitor = monitor

})()