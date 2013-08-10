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
    mixin: [ cs.marker.controller, cs.marker.view ],
    protos: {
        create: function () {
            cs(this).create(
                '{toolbarModel/view,' +
                'grid,' +
                'detailsModel/view,' +
                'rationalesModel/view}',
                app.ui.widget.toolbar.model, app.ui.widget.toolbar.view,
                app.ui.widget.grid.ctrl,
                app.ui.widget.trace.details.model, app.ui.widget.trace.details.view,
                app.ui.widget.rationales.model, app.ui.widget.rationales.view
            )

            cs(this).model({
                'event:clear' : { value: false, valid: 'boolean', autoreset: true }
            })
        },
        prepare: function () {
            var self = this

            var toolbarItems = [{
                label: 'Clear',
                icon:  'remove-sign',
                type:  'button',
                id: 'clearBtn'
            }]

            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/clearBtn', value: 'event:clear' })

            cs(self, 'toolbarModel').value('data:items', toolbarItems)

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
            cs(self, 'grid').call('columns', columns)

            cs(self).register({
                name: 'displayTraces', spool: 'prepared',
                func: function (traces) {
                    cs(self, 'grid').call('traces', traces)
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'prepared',
                func: function (trace) {
                    cs(self, 'grid').call('unshift', trace)
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
            var content = $.markup('checking-content')

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
                ctx: $('.trace-details-container', content)
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
                    cs(self, 'detailsModel').value('data:trace', nVal)
                    cs(self, 'rationalesModel').value('data:trace', nVal)
                    cs(self, 'rationalesModel').value('data:rationales', nVal !== null ? nVal.checks : [])
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        },
        cleanup: function () {
            cs(this).unspool('prepared')
        }
    }
})
