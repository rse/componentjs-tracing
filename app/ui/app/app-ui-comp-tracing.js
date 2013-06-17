/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.comp.tracing = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            cs(this).create('toolbarModel/view', app.ui.widget.toolbar.model, app.ui.widget.toolbar.view)
            cs(this).create('grid', new app.ui.widget.grid.ctrl(false))

            cs(this).model({
                'event:record'          : { value: false, valid: 'boolean', autoreset: true },
                'event:load'            : { value: false, valid: 'boolean', autoreset: true },
                'event:save'            : { value: false, valid: 'boolean', autoreset: true },
                'event:clear'           : { value: false, valid: 'boolean', autoreset: true },
                'event:filterKeyUp'     : { value: -1,    valid: 'number',  autoreset: true },
                'event:check-journal'   : { value: false, valid: 'boolean', autoreset: true },
                'state:record'          : { value: true,  valid: 'boolean'                  },
                'data:continuous'       : { value: false, valid: 'boolean', store: true     },
                'data:filter'           : { value: '',    valid: 'string'                   }
            })
        },
        prepare: function () {
            var toolbarItems = [{
                label: 'Record',
                event: 'event:record',
                type: 'button',
                pressedIcon: './static/img/record.png',
                id: 'recordBtn'
            }, {
                label: 'Load',
                event: 'event:load',
                type: 'button'
            }, {
                label: 'Save',
                event: 'event:save',
                type: 'button'
            }, {
                label: 'Clear',
                event: 'event:clear',
                type: 'button'
            }, {
                label: 'Check Journal',
                event: 'event:check-journal',
                type: 'button'
            }, {
                label: 'Check continuously',
                data: 'data:continuous',
                type: 'checkbox'
            }, {
                type: 'fill'
            }, {
                label: 'Filter:',
                type: 'text'
            }, {
                type: 'input',
                data: 'data:filter',
                event: 'event:filterKeyUp'
            }]

            cs(this, 'toolbarModel').value('data:items', toolbarItems)

            var columns = [
                { label: 'Time',        dataIndex: 'time',          width: 50, align: 'center' },
                { label: 'Source',      dataIndex: 'source'                                    },
                { label: 'ST',          dataIndex: 'sourceType',    width: 20, align: 'center' },
                { label: 'Origin',      dataIndex: 'origin'                                    },
                { label: 'OT',          dataIndex: 'originType',    width: 20, align: 'center' },
                { label: 'Operation',   dataIndex: 'operation',     width: 60, align: 'center' },
                { label: 'Parameters',  dataIndex: 'parameters'                                }
            ]

            cs(this, 'grid').call('columns', columns)
        },
        render: function () {
            var self = this
            var content = $.markup("tracing-content")

            cs(self).socket({
                scope: 'toolbarModel/view',
                ctx: $('.toolbar', content)
            })

            cs(self).socket({
                scope: 'grid',
                ctx: $('.grid', content)
            })

            cs(self).plug(content)

            cs(self).subscribe({
                name: 'event:new-trace', spool: 'rendered',
                func: function (ev, data) {
                    if (!cs(self).value('state:record'))
                        return
                    cs(self, 'grid').call('unshift', data)
                    if (cs(self).value('data:continuous'))
                        cs(self).publish('checkTrace', data)
                }
            })

            $('#tracing_upload').change(function (evt) {
                var files = evt.target.files;

                for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var content = e.target.result.split('\n')
                            var tuples = cs('/sv').call('parseLogfile', content)
                            cs(self, 'grid').call('tuples', tuples)
                            if (cs(self).value('data:continuous')) {
                                cs(self).publish('checkJournal')
                            }
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#tracing_upload').val('')
                }
            })

            cs(self).observe({
                name: 'data:filter', spool: 'rendered',
                func: function (ev, nVal) {
                    cs(self, 'grid').call('filter', nVal)
                }
            })

            cs(self).observe({
                name: 'event:record', spool: 'rendered',
                func: function () {
                    cs(self).value('state:record', !cs(self).value('state:record'))
                }
            })

            cs(self).observe({
                name: 'event:load', spool: 'rendered',
                func: function () {
                    $('#tracing_upload').trigger('click')
                }
            })

            cs(self).observe({
                name: 'event:save', spool: 'rendered',
                func: function () {
                    cs(self, 'grid').call('save')
                }
            })

            cs(self).observe({
                name: 'event:clear', spool: 'rendered',
                func: function () {
                    cs(this, 'grid').call('clear')
                }
            })

            cs(self).observe({
                name: 'event:filterKeyUp', spool: 'rendered',
                func: function (ev, nVal) {
                    if (nVal === 27) {
                        cs(self).value('data:filter', '')
                    }
                }
            })

            cs(self).register({
                name: 'tuples', spool: 'rendered',
                func: function () {
                    return cs(self, 'grid').call('tuples')
                }
            })

            cs(self).observe({
                name: 'event:check-journal', spool: 'rendered',
                func: function () {
                    cs(self).publish('checkJournal')
                }
            })
        },
        show: function () {
            var self = this

            cs(self).observe({
                name: 'state:record', spool: 'shown',
                touch: true,
                func: function (ev, nVal) {
                    cs(self, 'toolbarModel/view/recordBtn').value('state:pressed', nVal)
                }
            })
        },
        hide: function () {
            cs(this).unspool('shown')
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})