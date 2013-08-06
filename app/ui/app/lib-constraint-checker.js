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
        trace: null,
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
        traces: 0,
        unclassified: 0,
        displayStats: function () {
            console.log('Passed traces ' + this.passed)
            console.log('Failed traces ' + this.failed)
            console.log('Unclassified traces ' + this.unclassified)
            console.log('Processed traces ' + this.traces)
        },
        checkTrace: function (constraintSet, trace) {
            var run = new Run()
            run.trace = trace
            this.traces++
            for (var i = 0; i < constraintSet.length; i++) {
                var check = new Check()
                this.checkConstraint(constraintSet[i], trace, check)

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
            trace.result = run.result
            trace.checks = run.checks

            return trace
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
        checkConstraint: function (constraint, trace, check) {
            var condition = constraint.constraintBody.condition

            if (trace.evaluateExpr(condition)) {
                if (constraint.constraintBody.constraints) {
                    for (var i = 0; i < constraint.constraintBody.constraints.length; i++) {
                        condition = constraint.constraintBody.constraints[i].constraintBody.condition

                        var chk = new Check()
                        this.checkConstraint(constraint.constraintBody.constraints[i], trace, chk)
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
        stringifyTrace: function (trace) {
            return '< ' + trace.source + ', ' + trace.sourceType + ', ' + trace.origin + ', ' + trace.originType +
            ', ' + trace.operation + ', ' + JSON.stringify(trace.params) + ' >'
        }
    }
}

var create = new constraintChecker()

app.lib.constraintChecker = create

})()