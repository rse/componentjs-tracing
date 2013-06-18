/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.constraintset')

app.ui.widget.constraintset.model = cs.clazz({
    mixin: [ cs.marker.model, cs.marker.view ],
    dynamics: {
        editor: null
    },
    protos: {
        create: function () {
            var self = this

            /*  presentation model for items  */
            cs(self).model({
                'data:constraintset': { value: '', valid: 'string' },
                'data:savable':       { value: '', valid: 'string' }
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

            /* global ace: true */
            self.editor = ace.edit(id)
            self.editor.getSession().setMode('ace/mode/cjsc')
            self.editor.on('change', function () {
                cs(self).publish('editorChanged')
            })

            cs(self).observe({
                name: 'data:constraintset', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    self.editor.getSession().setValue(nVal)
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
