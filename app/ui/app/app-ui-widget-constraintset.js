/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global ace: true */
cs.ns('app.ui.widget.constraintset')

app.ui.widget.constraintset = cs.clazz({
    mixin: [ cs.marker.model, cs.marker.view ],
    dynamics: {
        editor: null
    },
    protos: {
        create: function () {
            var self = this

            /*  presentation model for items  */
            cs(self).model({
                'data:constraintset' : { value: '', valid: 'string', store: true     },
                'data:savable' :       { value: '', valid: 'string'                  }
            })

            /*  calculate the savable content on demand  */
            cs(self).observe({
                name: 'data:savable', spool: 'created',
                operation: 'get',
                func: function (ev) {
                    if (!self.editor)
                        cs(self).value('data:constraintset')
                    else
                        ev.result(self.editor.getSession().getValue())
                }
            })
        },
        render: function () {
            var self = this

            var id = 'id_' + Date.now()
            var content = $.markup('constraint-set-content', { id: id })

            cs(self).plug({
                object: content,
                spool: 'rendered'
            })

            var suspend = false

            self.editor = ace.edit(id)
            self.editor.getSession().setMode('ace/mode/' + cs(self).value('state:highlighting'))
            self.editor.on('change', function (ev, editor) {
                if (suspend)
                    return;
                cs(self).publish('editorChanged')
                suspend = true
                cs(self).value('data:constraintset', editor.getValue())
                suspend = false
            })

            cs(self).observe({
                name: 'data:constraintset', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    if (suspend)
                        return;
                    suspend = true
                    self.editor.setValue(nVal)
                    self.editor.clearSelection()
                    cs(self).publish('editorChanged')
                    suspend = false
                }
            })

            cs(self).observe({
                name: 'state:highlighting', spool: 'rendered',
                func: function (ev, nVal) {
                    self.editor.getSession().setMode('ace/mode/' + nVal)
                }
            })

            cs(self).register({
                name: 'displayError', spool: 'rendered',
                func: function (error) {
                    if (error === null)
                        self.editor.getSession().setAnnotations([])
                    else {
                        self.editor.getSession().setAnnotations([{
                            row: error.line - 1,
                            column: error.column,
                            text: error.message,
                            type: 'error'
                        }])
                    }
                    self.editor.focus()
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
