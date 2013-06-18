/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.comp.checking = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            cs(this).create('toolbarModel/view', app.ui.widget.toolbar.model, app.ui.widget.toolbar.view)
            cs(this).create('grid', app.ui.widget.grid.ctrl)
            cs(this).create('detailsModel/view', app.ui.widget.tuple.details.model, app.ui.widget.tuple.details.view)
            cs(this).create('rationalesModel/view', app.ui.widget.rationales.model, app.ui.widget.rationales.view)

            cs(this).model({
                'event:clear'         : { value: false, valid: 'boolean', autoreset: true },
                'event:check-journal' : { value: false, valid: 'boolean', autoreset: true },
                'data:continuous'     : { value: false, valid: 'boolean' }
            })
        },
        prepare: function () {
            var self = this

            var toolbarItems = [{
                label: 'Clear',
                event: 'event:clear',
                type: 'button'
            }]

            cs(self, 'toolbarModel').value('data:items', toolbarItems)

            var columns = [
                { label: 'Time',      dataIndex: 'time',       width: 50, align: 'center' },
                { label: 'Source',    dataIndex: 'source'                                 },
                { label: 'ST',        dataIndex: 'sourceType', width: 20, align: 'center' },
                { label: 'Origin',    dataIndex: 'origin'                                 },
                { label: 'OT',        dataIndex: 'originType', width: 20, align: 'center' },
                { label: 'Operation', dataIndex: 'operation',  width: 60, align: 'center' }
            ]

            cs(self, 'grid').call('columns', columns)

            cs(self).register({
                name: 'displayTuples', spool: 'prepared',
                func: function (tuples) {
                    cs(self, 'grid').call('tuples', tuples)
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'prepared',
                func: function (tuple) {
                    cs(self, 'grid').call('unshift', tuple)
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
            var content = $.markup("checking-content")

            cs(self).socket({
                scope: 'toolbarModel/view',
                ctx: $('.toolbar', content)
            })

            cs(self).socket({
                scope: 'grid',
                ctx: $('.grid', content)
            })

            cs(self).socket({
                scope: 'rationalesModel/view',
                ctx: $('.rationales-container', content)
            })

            cs(self).socket({
                scope: 'detailsModel/view',
                ctx: $('.tuple-details-container', content)
            })

            cs(self).plug(content)

            cs(self).observe({
                name: 'event:clear', spool: 'rendered',
                func: function () {
                    cs(self, 'grid').call('clear')
                    cs(self, 'rationalesModel').value('data:rationales', [])
                }
            })

            cs(self).subscribe({
                name: 'objectSelected', spool: 'rendered',
                func: function (ev, nVal) {
                    cs(self, 'detailsModel').value('data:tuple', nVal)
                    cs(self, 'rationalesModel').value('data:tuple', nVal)

                    if (nVal !== null)
                        cs(self, 'rationalesModel').value('data:rationales', nVal.checks)
                    else
                        cs(self, 'rationalesModel').value('data:rationales', [])
                }
            })
        },
        cleanup: function () {
            cs(this).unspool('prepared')
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})
