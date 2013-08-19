/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns("app.ui.widget.rationales")

app.ui.widget.rationales.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            /*  presentation model for items  */
            cs(this).model({
                'data:trace'        : { value: null, valid: 'object' },
                'data:rationales'   : { value: [], valid: '[any*]' }
            })
        }
    }
})

app.ui.widget.rationales.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this
            var rationales = $.markup('rationales')

            cs(self).plug(rationales)

            var gatherRationales = function (checks, acc) {
                for (var i = 0; i < checks.length; i++) {
                    acc.push(checks[i])
                    gatherRationales(checks[i].subs, acc)
                }
                return acc
            }

            cs(self).observe({
                name: 'data:rationales', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    /*  remove existing rationales first  */
                    $('tr', rationales).remove()

                    var data = {}
                    var checks = gatherRationales(nVal, [])

                    /* add new rationales  */
                    for (var i = 0; i < checks.length; i++) {
                        var item = checks[i].constraint
                        data.title = item.id
                        data.rationale = item.constraintBody.rationale
                        data.icon = item.type !== 'temporal-constraint' ? 'icon-screenshot' : 'icon-time'

                        var rationale = $.markup('rationales/rationales-item', data)
                        var clazz = 'red'
                        if (checks[i].result === 'PASS' || checks[i].result === 'PASS_FINAL') {
                            clazz = 'green'
                        }
                        $('.rationales-title', rationale).addClass(clazz)
                        $('.table', rationales).append(rationale)
                    }

                    var trace = cs(self).value('data:trace')
                    if (trace === null)
                        return;
                    if (trace.result === 'UNCLASSIFIED') {
                        data.title = 'No constraint found, that matches this trace'
                        data.rationale = 'None of the given constraints conditions matched this trace, thus no assumption about its validity could be made'
                        data.icon = 'icon-screenshot'
                        $('.table', rationales).append($.markup('rationales/rationales-item', data))
                    }
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})