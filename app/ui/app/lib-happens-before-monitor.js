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

    this.temporalConstraint = temporalConstraint

    //TODO - init - process the constraint

    this.processTrace = function (trace) {
        trace.checks = [{
            constraint: temporalConstraint,
            subs: [],
            result: 'FAIL'
        }]

        return trace
    }
}

app.lib.happens_before_monitor = monitor

})()