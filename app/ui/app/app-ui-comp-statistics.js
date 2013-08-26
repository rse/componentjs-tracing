/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.comp.statistics = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this

            cs(self).property('ComponentJS:state-auto-increase', false)

            cs(self).create('model/view/{grid,toolbar}',
                app.ui.comp.statistics.model,
                app.ui.comp.statistics.view,
                app.ui.widget.grid,
                app.ui.widget.toolbar
            )

            var columns = [
                { label: 'Occurrence',  dataIndex: 'occurence',  width: 70, align: 'center' },
                { label: 'Source',      dataIndex: 'source'                                 },
                { label: 'ST',          dataIndex: 'sourceType', width: 20, align: 'center' },
                { label: 'Origin',      dataIndex: 'origin'                                 },
                { label: 'OT',          dataIndex: 'originType', width: 20, align: 'center' },
                { label: 'Operation',   dataIndex: 'operation',  width: 60, align: 'center' },
                { label: 'Parameters',  dataIndex: 'parameters'                             }
            ]

            cs(self, 'model/view/grid').call('initialize', {
                columns: columns,
                selectable: false,
                sorting: { dataIndex: 'occurence', direction: 'desc' }
            })

            cs(self).subscribe({
                name: 'event:new-trace', spool: 'created',
                spreading : true, capturing : false, bubbling : false,
                func: function (ev, trace) {
                    if (trace.hidden || !cs(self, 'model').value('state:record'))
                        return
                    cs(self, 'model').call('newTrace', trace)
                }
            })

            cs(self).subscribe({
                name: 'event:update', spool: 'rendered',
                func: function (ev, trace) {
                    cs(self, 'model/view/grid').call('insert', trace)
                }
            })
        },
        render: function () {
            var toolbarItems = [{
                label: 'Record',
                icon:  'microphone',
                type: 'button',
                id: 'recordBtn',
                click: 'event:record',
                state: 'state:record'
            }, {
                label: 'Clear',
                icon:  'remove-sign',
                type: 'button',
                id: 'clearBtn',
                click: 'event:clear'
            }, {
                label: 'Ignore parameters',
                icon: 'repeat',
                type: 'button',
                id: 'ignoreParams',
                click: 'event:ignore-params',
                state: 'state:ignore-params'
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

            cs(this, 'model/view/toolbar').call('initialize', toolbarItems)
        },
        show: function () {
            var self = this

            cs(self, 'model').observe({
                name: 'event:clear', spool: '..:visible',
                func: function () {
                    cs(self, 'model/view/grid').call('clear')
                    cs(self, 'model').value('data:hashed-traces', {})
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

app.ui.comp.statistics.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', true)
            cs(self).model({
                'data:hashed-traces'  : { value: {},    valid: 'object'                   },
                'event:clear'         : { value: false, valid: 'boolean', autoreset: true },
                'event:record'        : { value: false, valid: 'boolean', autoreset: true },
                'state:record'        : { value: false, valid: 'boolean', store: true     },
                'event:filterKeyUp'   : { value: -1,    valid: 'number',  autoreset: true },
                'data:filter'         : { value: '',    valid: 'string', store: true      },
                'state:filter'        : { value: '',    valid: 'string', store: true      },
                'event:ignore-params' : { value: false, valid: 'boolean', autoreset: true },
                'state:ignore-params' : { value: false, valid: 'boolean', store: true     }
            })

            cs(self).register({
                name: 'newTrace', spool: 'created',
                func: function (trace) {
                    var data = cs(self).value('data:hashed-traces')
                    var ignoreParams = cs(self).value('state:ignore-params')
                    var hash = trace.hash(ignoreParams)
                    if (!data[hash]) {
                        data[hash] = trace
                        trace.occurence = 1
                    }
                    else
                        data[hash].occurence += 1
                    cs(self).publish('event:update', data[hash])
                }
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

            cs(self).observe({
                name: 'event:record', spool: 'visible',
                func: function () {
                    cs(self).value('state:record', !cs(self).value('state:record'))
                }
            })

            cs(self).observe({
                name: 'event:ignore-params', spool: 'visible',
                func: function () {
                    cs(self).value('state:ignore-params', !cs(self).value('state:ignore-params'))
                }
            })
        }
    }
})

app.ui.comp.statistics.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        idx: 0,
        tooltip: null,
        timer: null,
        legend: null,
        layoutRoot: null,
        tree: null
    },
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
        },
        render: function () {
            var self = this
            var content = $.markup('statistics-content')

            cs(self).socket({
                scope: 'toolbar',
                ctx: $('.toolbar', content)
            })

            cs(self).socket({
                scope: 'grid',
                ctx: $('.grid', content)
            })

            cs(self).plug({
                object: content,
                spool: 'materialized'
            })
        }
    }
})