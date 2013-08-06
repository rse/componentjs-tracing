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
            cs(this).create('toolbarModel/view',
                app.ui.widget.toolbar.model,
                app.ui.widget.toolbar.view
            )
            cs(this).create('grid', new app.ui.widget.grid.ctrl(false))

            cs(this).model({
                'event:record'        : { value: false, valid: 'boolean', autoreset: true },
                'event:load'          : { value: false, valid: 'boolean', autoreset: true },
                'event:save'          : { value: false, valid: 'boolean', autoreset: true },
                'event:clear'         : { value: false, valid: 'boolean', autoreset: true },
                'event:filterKeyUp'   : { value: -1,    valid: 'number',  autoreset: true },
                'event:check-journal' : { value: false, valid: 'boolean', autoreset: true },
                'state:record'        : { value: true,  valid: 'boolean'                  },
                'event:continuous'    : { value: false, valid: 'boolean', autoreset: true },
                'state:continuously'  : { value: false, valid: 'boolean', store: true     },
                'data:filter'         : { value: '',    valid: 'string'                   }
            })
        },
        prepare: function () {
            var toolbarItems = [{
                label: 'Record',
                icon:  "microphone",
                type: 'button',
                id: 'recordBtn'
            }, {
                label: 'Load',
                icon:  "upload-alt",
                type: 'button',
                id: 'loadBtn'
            }, {
                label: 'Save',
                icon:  "download-alt",
                id: 'saveBtn',
                type: 'button'
            }, {
                label: 'Clear',
                icon:  "remove-sign",
                type: 'button',
                id: 'clearBtn'
            }, {
                label: 'Check Once',
                icon:  "ok-sign",
                type: 'button',
                id: 'journalBtn'
            }, {
                label: 'Check Continuously',
                icon: "repeat",
                type: 'button',
                id: 'continuousBtn'
            }, {
                type: 'fill'
            }, {
                label: 'Filter:',
                icon:  "filter",
                type: 'text'
            }, {
                type: 'input',
                id: 'filterInp'
            }]

            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/loadBtn',       value: 'event:load'          })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/recordBtn',     value: 'event:record'        })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/saveBtn',       value: 'event:save'          })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/clearBtn',      value: 'event:clear'         })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/journalBtn',    value: 'event:check-journal' })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/continuousBtn', value: 'event:continuous'    })
            cs(this).property({ name: 'keyup',   scope: 'toolbarModel/view/filterInp',     value: 'event:filterKeyUp'   })
            cs(this).property({ name: 'data',    scope: 'toolbarModel/view/filterInp',     value: 'data:filter'         })

            cs(this, 'toolbarModel').value('data:items', toolbarItems)

            var linkRenderer = function (op) {
                /* global Handlebars: true */
                return new Handlebars.SafeString('<a href="http://componentjs.com/api/api.screen.html#' + op + '" target="_BLANK">' + op + '</a>')
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
                        return;
                    cs(self, 'grid').call('unshift', data)
                    if (cs(self).value('state:continuously'))
                        cs(self).publish('checkTrace', data)
                }
            })

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
                            cs(self, 'grid').call('traces', traces)
                            if (cs(self).value('state:continuously'))
                                cs(self).publish('checkJournal')
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#tracing_upload').val('')
                }
            })

            cs(self).observe({
                name: 'event:record', spool: 'rendered',
                func: function () {
                    cs(self).value('state:record', !cs(self).value('state:record'))
                }
            })

            cs(self).observe({
                name: 'event:continuous', spool: 'rendered',
                func: function () {
                    cs(self).value('state:continuously', !cs(self).value('state:continuously'))
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
                    if (nVal === 27 /* ESCAPE */) {
                        cs(self).value('data:filter', '')
                        cs(self, 'grid').call('filter', '')
                    }
                    else if (nVal === 13 /* RETURN */)
                        cs(self, 'grid').call('filter', cs(self).value('data:filter'))
                }
            })

            cs(self).register({
                name: 'traces', spool: 'rendered',
                func: function () {
                    return cs(self, 'grid').call('traces')
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

            cs(self).observe({
                name: 'state:continuously', spool: 'shown',
                touch: true,
                func: function (ev, nVal) {
                    cs(self, 'toolbarModel/view/continuousBtn').value('state:pressed', nVal)
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
