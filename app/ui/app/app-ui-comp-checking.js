/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global Handlebars: true */

app.ui.comp.checking = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', false)
            cs(this).create(
                'model/view/{toolbar,' +
                'grid,' +
                'details,' +
                'rationales}',
                app.ui.comp.checking.model,
                app.ui.comp.checking.view,
                app.ui.widget.toolbar,
                app.ui.widget.grid,
                app.ui.widget.trace.details,
                app.ui.widget.rationales
            )
        },
        prepare: function () {
            var self = this

            var toolbarItems = [{
                label: 'Clear',
                icon:  'remove-sign',
                type:  'button',
                id: 'clearBtn',
                click: 'event:clear'
            }]

            cs(self, 'model/view/toolbar').call('initialize', toolbarItems)

            var linkRenderer = function (op) {
                return new Handlebars.SafeString(
                    '<a href="http://componentjs.com/api/api.screen.html#' + op +
                    '" target="_BLANK">' + op + '</a>'
                )
            }
            var columns = [
                { label: 'Time',      dataIndex: 'time',       width: 50, align: 'center' },
                { label: 'Source',    dataIndex: 'source'                                 },
                { label: 'ST',        dataIndex: 'sourceType', width: 20, align: 'center' },
                { label: 'Origin',    dataIndex: 'origin'                                 },
                { label: 'OT',        dataIndex: 'originType', width: 20, align: 'center' },
                { label: 'Operation', dataIndex: 'operation',  width: 60, align: 'center', renderer: linkRenderer }
            ]
            cs(self, 'model/view/grid').call('initialize', columns)

            cs(self).register({
                name: 'displayTraces', spool: 'prepared',
                func: function (traces) {
                    cs(self, 'model/view/grid').call('traces', traces)
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'prepared',
                func: function (trace) {
                    cs(self, 'model/view/grid').call('unshift', trace)
                }
            })

            cs(self).register({
                name: 'displayRationales', spool: 'prepared',
                func: function (rationales) {
                    cs(self).value('event:clear', true)
                    self.rationales = rationales
                }
            })
        },
        render: function () {
            var self = this

            cs(self, 'model').observe({
                name: 'event:clear', spool: '..:materialized',
                func: function () {
                    cs(self, 'model/view/grid').call('clear')
                    cs(self, 'model/view/rationales').call('setRationales', [])
                }
            })

            cs(self).subscribe({
                name: 'objectSelected', spool: 'materialized',
                func: function (ev, nVal) {
                    cs(self, 'model/view/details').call('setTrace', nVal)
                    cs(self, 'model/view/rationales').call('setTrace', nVal)
                    cs(self, 'model/view/rationales').call('setRationales', nVal !== null ? nVal.checks : [])
                }
            })
        }
    }
})

app.ui.comp.checking.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(this).model({
                'event:clear' : { value: false, valid: 'boolean', autoreset: true }
            })
        }
    }
})

app.ui.comp.checking.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
        },
        render: function () {
            var self = this
            var content = $.markup('checking-content')

            cs(self).socket({
                scope: 'toolbar',
                ctx: $('.toolbar', content)
            })

            cs(self).socket({
                scope: 'grid',
                ctx: $('.grid', content)
            })

            cs(self).socket({
                scope: 'rationales',
                ctx: $('.rationales-container', content)
            })

            cs(self).socket({
                scope: 'details',
                ctx: $('.trace-details-container', content)
            })

            cs(self).plug({
                object: content,
                spool: 'materialized'
            })
        }
    }
})