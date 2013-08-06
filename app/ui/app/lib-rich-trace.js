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

var enrich = function (trace) {
    trace.evaluateExpr = function (expression, binding) { return evaluateExpr(trace, expression, binding) }
    trace.evaluateTerm = function (term, binding) { return evaluateTerm(trace, term, binding) }
    trace.evaluateFunc = function (statement, binding) { return evaluateFunc(trace, statement, binding)}

    return trace
}

app.lib.richTrace = {}
app.lib.richTrace.enrich = enrich

})()