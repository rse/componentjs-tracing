/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global clearTimeout: true, setTimeout: true, setInterval: true, prompt: true, escape: true */

app.ui.comp.statistics = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this

            cs(self).property('ComponentJS:state-auto-increase', true)

            cs(self).create('model/view/{grid,toolbarModel/view}',
                app.ui.comp.statistics.model,
                app.ui.comp.statistics.view,
                new app.ui.widget.grid.ctrl(false),
                app.ui.widget.toolbar.model,
                app.ui.widget.toolbar.view
            )

            cs(self).subscribe({
                name: 'event:new-trace', spool: 'created',
                spreading : true, capturing : false, bubbling : false,
                func: function (ev, trace) {
                    if (!cs(self, 'model').value('state:record'))
                        return
                    cs(self, 'model').call('newTrace', trace)
                }
            })
        },
        render: function () {
            var toolbarItems = [{
                label: 'Record',
                icon:  'microphone',
                type: 'button',
                id: 'recordBtn'
            }, {
                label: 'Clear',
                icon:  'remove-sign',
                type: 'button',
                id: 'clearBtn'
            }, {
                label: 'Ignore parameters',
                icon: 'repeat',
                type: 'button',
                id: 'ignoreParams'
            }]

            cs(this).property({ name: 'clicked', scope: 'model/view/toolbarModel/view/clearBtn', value: 'event:clear' })
            cs(this).property({ name: 'clicked', scope: 'model/view/toolbarModel/view/recordBtn', value: 'event:record' })
            cs(this).property({ name: 'clicked', scope: 'model/view/toolbarModel/view/ignoreParams', value: 'event:ignore-params' })
            cs(this, 'model/view/toolbarModel').value('data:items', toolbarItems)
        },
        show: function () {
            var self = this

            cs(self, 'model').observe({
                name: 'event:clear', spool: '..:shown',
                func: function () {
                    cs(self, 'model/view/grid').call('clear')
                }
            })

            cs(self, 'model').observe({
                name: 'state:record', spool: '..:shown',
                touch: true,
                func: function (ev, nVal) {
                    cs(self, 'model/view/toolbarModel/view/recordBtn').value('state:pressed', nVal)
                }
            })

            cs(self, 'model').observe({
                name: 'state:ignore-params', spool: '..:shown',
                touch: true,
                func: function (ev, nVal) {
                    cs(self, 'model/view/toolbarModel/view/ignoreParams').value('state:pressed', nVal)
                }
            })
        },
        hide: function () {
            cs(this).unspool('shown')
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

app.ui.comp.statistics.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this

            cs(self).model({
                'data:hashed-traces'  : { value: {},    valid: 'object'                   },
                'event:clear'         : { value: false, valid: 'boolean', autoreset: true },
                'event:record'        : { value: false, valid: 'boolean', autoreset: true },
                'state:record'        : { value: false, valid: 'boolean', store: true     },
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
                        cs(self, 'view/grid').call('push', data[hash])
                        cs(self).touch('data:hashed-traces')
                    }
                    else {
                        data[hash].occurence += 1
                        cs(self, 'view/grid').call('update', data[hash])
                    }
                }
            })
        },
        render: function () {
            var self = this

            cs(self).observe({
                name: 'event:record', spool: 'rendered',
                func: function () {
                    cs(self).value('state:record', !cs(self).value('state:record'))
                }
            })

            cs(self).observe({
                name: 'event:ignore-params', spool: 'rendered',
                func: function () {
                    cs(self).value('state:ignore-params', !cs(self).value('state:ignore-params'))
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        },
        destroy: function () {
            cs(this).unspool('created')
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
        prepare: function () {
            var columns = [
                { label: 'Occurrence',  dataIndex: 'occurence',  width: 70, align: 'center' },
                { label: 'Source',      dataIndex: 'source'                                 },
                { label: 'ST',          dataIndex: 'sourceType', width: 20, align: 'center' },
                { label: 'Origin',      dataIndex: 'origin'                                 },
                { label: 'OT',          dataIndex: 'originType', width: 20, align: 'center' },
                { label: 'Operation',   dataIndex: 'operation',  width: 60, align: 'center' },
                { label: 'Parameters',  dataIndex: 'parameters'                             }
            ]

            cs(this, 'grid').call('columns', columns)
        },
        render: function () {
            var self = this
            var content = $.markup('statistics-content')

            cs(self).socket({
                scope: 'toolbarModel/view',
                ctx: $('.toolbar', content)
            })

            cs(self).socket({
                scope: 'grid',
                ctx: $('.grid', content)
            })

            cs(self).plug({
                object: content,
                spool: 'rendered'
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})