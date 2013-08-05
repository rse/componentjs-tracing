/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var evaluateExpr = function (ctx, expression, binding) {
    var type = expression.type

    if (type === 'true')
        return true
    else if (type === 'false')
        return false
    else if (type === 'and')
        return evaluateExpr(ctx, expression.left, binding) && evaluateExpr(ctx, expression.right, binding)
    else if (type === 'or')
        return evaluateExpr(ctx, expression.left, binding) || evaluateExpr(ctx, expression.right, binding)
    else if (type === 'not')
        return !evaluateExpr(ctx, expression.expression, binding)
    else if (type === 'clasped')
        return evaluateExpr(ctx, expression.expression, binding)
    else if (type === 'term')
        return evaluateTerm(ctx, expression, binding)
    else if (type === 'function')
        return evaluateFunc(ctx, expression, binding)
}

var evaluateFunc = function (ctx, statement, binding) {
    if (statement.name === 'isParent') {
        var child = eval('binding["' + statement.params[1][0] + '"]' + (statement.params[1].length > 1 ? '.' + _.tail(statement.params[1]).join('.') : ''))
        var parent = eval('binding["' + statement.params[0][0] + '"]' + (statement.params[0].length > 1 ? '.' + _.tail(statement.params[0]).join('.') : ''))
        return child.indexOf(parent) !== -1
    }
}

var evaluateTerm = function (ctx, term, binding) {
    binding = binding || {}
    binding.source = ctx.source
    binding.origin = ctx.origin
    binding.sourceType = ctx.sourceType
    binding.originType = ctx.originType
    binding.operation = ctx.operation
    binding.parameters = ctx.parameters

    var expr
    if (term.field1)
        expr = 'binding["' + term.field1[0] + '"]' + (term.field1.length > 1 ? '.' + _.tail(term.field1).join('.') : '') + ' ' + term.op +
                ' ' + 'binding["' + term.field2[0] + '"]' + (term.field2.length > 1 ? '.' + _.tail(term.field2).join('.') : '')
    else
        expr = 'binding["' + term.field[0] + '"]' + (term.field.length > 1 ? '.' + _.tail(term.field).join('.') : '') + ' ' + term.op + ' ' + term.value
    return eval(expr)
}

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
            if (evaluateExpr(trace, link.condition, ctx)) {
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
            var res = evaluateExpr(trace, filter.condition)
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