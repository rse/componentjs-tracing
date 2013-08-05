/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var Run = function () {
    return {
        tuple: null,
        checks: [],
        result: 'FAIL'
    }
}

var Check = function () {
    return {
        constraint: null,
        subs: [],
        result: 'FAIL'
    }
}

var constraintChecker = function () {
    return {
        failed: 0,
        passed: 0,
        tuples: 0,
        unclassified: 0,
        displayStats: function () {
            console.log('Passed tuples ' + this.passed)
            console.log('Failed tuples ' + this.failed)
            console.log('Unclassified tuples ' + this.unclassified)
            console.log('Processed tuples ' + this.tuples)
        },
        checkTuple: function (constraintSet, tuple) {
            var run = new Run()
            run.tuple = tuple
            this.tuples++
            for (var i = 0; i < constraintSet.length; i++) {
                var check = new Check()
                this.checkConstraint(constraintSet[i], tuple, check)

                if (check.constraint !== null) {
                    run.checks.push(check)
                    run.result = check.result
                }

                var matches = check.result.match(/(.*)(?=_FINAL)/)
                if (matches) {
                    run.result = matches[1]
                    break
                }
            }
            if (run.checks.length === 0) {
                this.unclassified++
                run.result = 'UNCLASSIFIED'
            }
            else if (run.result === 'PASS') {
                this.passed++
            }
            else if (run.result === 'FAIL') {
                this.failed++
            }
            tuple.result = run.result
            tuple.checks = run.checks

            return tuple
        },
        printReason: function (checks, depth) {
            depth = depth || 0

            for (var i = 0; i < checks.length; i++) {
                var output = '# '
                for (var x = 0; x < depth; x++) {
                    output += ' '
                }
                output += checks[i].constraint.id
                console.log(output)

                this.printReason(checks[i].subs, depth + 1)
            }
        },
        checkConstraint: function (constraint, tuple, check) {
            var condition = constraint.constraintBody.condition

            if (this.evaluateExpr(tuple, condition)) {
                if (constraint.constraintBody.constraints) {
                    for (var i = 0; i < constraint.constraintBody.constraints.length; i++) {
                        condition = constraint.constraintBody.constraints[i].constraintBody.condition

                        var chk = new Check()
                        this.checkConstraint(constraint.constraintBody.constraints[i], tuple, chk)
                        if (chk.constraint !== null) {
                            check.subs.push(chk)
                            check.result = chk.result
                            if (check.result.match(/(.*)(?=_FINAL)/))
                                break
                        }
                    }
                    if (check.subs.length !== 0)
                        check.constraint = constraint
                }
                else {
                    check.result = constraint.constraintBody.result
                    check.constraint = constraint
                }
            }
        },
        stringifyTuple: function (tuple) {
            return '< ' + tuple.source + ', ' + tuple.sourceType + ', ' + tuple.origin + ', ' + tuple.originType +
            ', ' + tuple.operation + ', ' + JSON.stringify(tuple.params) + ' >'
        },
        stringifyExpr: function (expression) {
            var type = expression.type

            if (type === 'true')
                return ' true '
            else if (type === 'false')
                return ' false '
            else if (type === 'and')
                return this.stringifyExpr(expression.left) + ' && ' + this.stringifyExpr(expression.right)
            else if (type === 'or')
                return this.stringifyExpr(expression.left) + ' || ' + this.stringifyExpr(expression.right)
            else if (type === 'not')
                return '! ' + this.stringifyExpr(expression.expression)
            else if (type === 'clasped')
                return '( ' + this.stringifyExpr(expression.expression) + ' )'
            else if (type === 'term')
                return this.stringifyTerm(expression)
        },
        stringifyTerm: function (term) {
            return term.field + ' ' + term.op + ' ' + term.value
        },
        evaluateExpr: function (ctx, expression) {
            var type = expression.type

            if (type === 'true')
                return true
            else if (type === 'false')
                return false
            else if (type === 'and')
                return this.evaluateExpr(ctx, expression.left) && this.evaluateExpr(ctx, expression.right)
            else if (type === 'or')
                return this.evaluateExpr(ctx, expression.left) || this.evaluateExpr(ctx, expression.right)
            else if (type === 'not')
                return !this.evaluateExpr(ctx, expression.expression)
            else if (type === 'clasped')
                return this.evaluateExpr(ctx, expression.expression)
            else if (type === 'term')
                return this.evaluateTerm(ctx, expression)
        },
        evaluateTerm: function (ctx, term) {
            var op = term.op

            var source = ctx.source
            var origin = ctx.origin
            var sourceType = ctx.sourceType
            var originType = ctx.originType
            var operation = ctx.operation
            var params = ctx.parameters

            return eval(term.field + ' ' + term.op + ' ' + term.value)
        }
    }
}

var create = new constraintChecker()

app.lib.constraintChecker = create

})()