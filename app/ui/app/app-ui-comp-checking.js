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
            }, {
                label: 'Filter:',
                icon:  'filter',
                type: 'text'
            }, {
                type: 'input',
                id: 'filterInp',
                keyup: 'event:filterKeyUp',
                data: 'state:filter'
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
            cs(self, 'model/view/grid').call('initialize', {
                columns: columns,
                selectable: true,
                sorting: { dataIndex: 'time', direction: 'desc' }
            })

            cs(self).register({
                name: 'displayTraces', spool: 'prepared',
                func: function (traces) {
                    cs(self, 'model/view/grid').call('traces', traces)
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'prepared',
                func: function (trace) {
                    cs(self, 'model/view/grid').call('insert', trace)
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
        show: function () {
            var self = this

            cs(self, 'model').observe({
                name: 'event:clear', spool: '..:visible',
                func: function () {
                    cs(self, 'model/view/grid').call('clear')
                    cs(self, 'model/view/rationales').call('setRationales', [])
                }
            })

            cs(self).subscribe({
                name: 'objectSelected', spool: 'visible',
                func: function (ev, nVal) {
                    cs(self, 'model/view/details').call('setTrace', nVal)
                    cs(self, 'model/view/rationales').call('setTrace', nVal)
                    cs(self, 'model/view/rationales').call('setRationales', nVal !== null ? nVal.checks : [])
                }
            })

            cs(self, 'model').observe({
                name: 'data:filter', spool: '..:visible',
                func: function (ev, filter) {
                    cs(self, 'model/view/grid').call('filter', filter)
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
                'event:clear'          : { value: false, valid: 'boolean', autoreset: true },
                'event:filterKeyUp'    : { value: -1,    valid: 'number',  autoreset: true },
                'data:filter'          : { value: '',    valid: 'string', store: true      },
                'state:filter'         : { value: '',    valid: 'string', store: true      }
            })
        },
        show: function () {
            var self = this
            cs(self).observe({
                name: 'event:filterKeyUp', spool: 'visible',
                func: function (ev, nVal) {
                    if (nVal === 27 /* ESCAPE */)
                        cs(self).value('state:filter', '')
                    if (nVal === 13 /* RETURN */ || nVal === 27 /* ESCAPE */)
                        cs(self).value('data:filter', cs(self).value('state:filter'))
                }
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