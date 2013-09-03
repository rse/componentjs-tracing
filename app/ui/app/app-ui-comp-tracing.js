/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global Handlebars: true, btoa: true */

app.ui.comp.tracing = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', false)
            cs(this).create('model/view/{toolbar,grid}',
                app.ui.comp.tracing.model,
                app.ui.comp.tracing.view,
                app.ui.widget.toolbar,
                app.ui.widget.grid
            )
        },
        prepare: function () {
            var self = this
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
                label: 'Load',
                icon:  'upload-alt',
                type: 'button',
                id: 'loadBtn',
                click: 'event:load'
            }, {
                label: 'Save',
                icon:  'download-alt',
                id: 'saveBtn',
                type: 'button',
                click: 'event:save'
            }, {
                label: 'Check Once',
                icon:  'ok-sign',
                type: 'button',
                id: 'journalBtn',
                click: 'event:check-journal'
            }, {
                label: 'Check Continuously',
                icon: 'repeat',
                type: 'button',
                id: 'continuousBtn',
                stateClass: 'icon-spin',
                click: 'event:continuous',
                state: 'state:continuously'
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
                { label: 'Time',        dataIndex: 'time',       width: 50, align: 'center'                         },
                { label: 'Source',      dataIndex: 'source'                                                         },
                { label: 'ST',          dataIndex: 'sourceType', width: 20, align: 'center'                         },
                { label: 'Origin',      dataIndex: 'origin'                                                         },
                { label: 'OT',          dataIndex: 'originType', width: 20, align: 'center'                         },
                { label: 'Operation',   dataIndex: 'operation',  width: 60, align: 'center', renderer: linkRenderer },
                { label: 'Parameters',  dataIndex: 'parameters'                                                     }
            ]

            cs(self, 'model/view/grid').call('initialize', {
                columns: columns,
                selectable: false,
                sorting: { dataIndex: 'time', direction: 'desc' }
            })

            cs(self).subscribe({
                name: 'event:new-trace', spool: 'prepared',
                spreading : true, capturing : false, bubbling : false,
                func: function (ev, trace) {
                    if (trace.hidden || !cs(self, 'model').value('state:record'))
                        return;
                    cs(self, 'model').value('data:traces').push(trace)
                    cs(self, 'model/view/grid').call('insert', trace)
                    if (cs(self, 'model').value('state:continuously'))
                        cs(self).publish('checkTrace', trace)
                }
            })
        },
        show: function () {
            var self = this

            $('#tracing_upload').change(function (evt) {
                var files = evt.target.files;
                for (var i = 0, f; (f = files[i]); i++) {
                    /* global FileReader: true */
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var file = e.target.result.trim()
                            var content = file.split('\n')
                            var traces = cs('/sv').call('parseLogfile', content)
                            cs(self, 'model').value('data:traces', traces)
                            cs(self, 'model/view/grid').call('traces', traces.concat().reverse())
                            if (cs(self, 'model').value('state:continuously'))
                                cs(self).publish('checkJournal', traces)
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#tracing_upload').val('')
                }
            })

            cs(self, 'model').observe({
                name: 'event:record', spool: '..:visible',
                func: function () {
                    cs(self, 'model').value('state:record', !cs(self, 'model').value('state:record'))
                }
            })

            cs(self, 'model').observe({
                name: 'event:continuous', spool: '..:visible',
                func: function () {
                    cs(self, 'model').value('state:continuously', !cs(self, 'model').value('state:continuously'))
                }
            })

            cs(self, 'model').observe({
                name: 'event:load', spool: '..:visible',
                func: function () {
                    $('#tracing_upload').trigger('click')
                }
            })

            cs(self, 'model').observe({
                name: 'event:save', spool: '..:visible',
                func: function () {
                    var traces = cs(self, 'model').value('data:traces')
                    var result = []
                    _.each(traces, function (trace) {
                        result.push(trace.toString())
                    })
                    var str = result.join(' \n')
                    window.location = 'data:application/octet-stream;base64,'+
                        btoa(str)
                }
            })

            cs(self, 'model').observe({
                name: 'event:clear', spool: '..:visible',
                func: function () {
                    cs(self, 'model').value('data:traces', [])
                    cs(self, 'model/view/grid').call('clear')
                }
            })

            cs(self, 'model').observe({
                name: 'data:filter', spool: '..:visible',
                func: function (ev, filter) {
                    cs(self, 'model/view/grid').call('filter', filter)
                }
            })

            cs(self).register({
                name: 'traces', spool: 'visible',
                func: function () {
                    return cs(self, 'model/view/grid').call('traces')
                }
            })

            cs(self, 'model').observe({
                name: 'event:check-journal', spool: '..:visible',
                func: function () {
                    cs(self).publish('checkJournal', cs(self, 'model').value('data:traces'))
                }
            })
        }
    }
})

app.ui.comp.tracing.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(this).model({
                'event:record'         : { value: false, valid: 'boolean', autoreset: true },
                'event:load'           : { value: false, valid: 'boolean', autoreset: true },
                'event:save'           : { value: false, valid: 'boolean', autoreset: true },
                'event:clear'          : { value: false, valid: 'boolean', autoreset: true },
                'event:filterKeyUp'    : { value: -1,    valid: 'number',  autoreset: true },
                'data:filter'          : { value: '',    valid: 'string', store: true      },
                'state:filter'         : { value: '',    valid: 'string', store: true      },
                'event:check-journal'  : { value: false, valid: 'boolean', autoreset: true },
                'state:record'         : { value: true,  valid: 'boolean', store: true     },
                'event:continuous'     : { value: false, valid: 'boolean', autoreset: true },
                'state:continuously'   : { value: false, valid: 'boolean', store: true     },
                'data:traces'          : { value: [],    valid: '[object*]'                }
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

app.ui.comp.tracing.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
        },
        render: function () {
            var self = this
            var content = $.markup('tracing-content')

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