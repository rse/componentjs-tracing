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
    mixin: [ cs.marker.controller ],
    dynamics: {
        editor: null,
        timer: null
    },
    protos: {
        create: function () {
            var self = this

            cs(self).create('model/view',
                app.ui.widget.constraintset.model,
                app.ui.widget.constraintset.view
            )

            /*  calculate the savable content on demand  */
            cs(self).register({
                name: 'getContent', spool: 'created',
                func: function () {
                    return cs(self, 'model').value('data:constraintset')
                }
            })

            cs(self, 'model').observe({
                name: 'data:constraintset', spool: '..:created',
                touch: true,
                func: function (ev, content) {
                    if (self.timer !== null) {
                        /* global clearTimeout: true */
                        clearTimeout(self.timer)
                    }
                    /* global setTimeout: true */
                    self.timer = setTimeout(function () {
                        cs(self).publish('setChanged', content)
                    }, 1000)
                }
            })

            cs(self).register({
                name: 'setContent', spool: 'created',
                func: function (content) {
                    cs(self, 'model').value('data:constraintset', content, true)
                }
            })

            cs(self).register({
                name: 'displaySyntacticError', spool: 'created',
                func: function (errors) {
                    cs(self, 'model').value('state:syntactic-errors', errors)
                }
            })

            cs(self).register({
                name: 'displaySemanticError', spool: 'created',
                func: function (errors) {
                    cs(self, 'model').value('state:semantic-errors', errors)
                }
            })
        },
        destroy: function () {
            clearTimeout(this.timer)
        }
    }
})

app.ui.widget.constraintset.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            /*  presentation model for items  */
            cs(this).model({
                'data:constraintset'     : { value: '', valid: 'string', store: true },
                'data:savable'           : { value: '', valid: 'string'              },
                'state:domain'           : { value: '', valid: 'string'              },
                'state:semantic-errors'  : { value: [], valid: 'any'                 },
                'state:syntactic-errors' : { value: [], valid: 'any'                 }
            })
        }
    }
})

app.ui.widget.constraintset.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        show: function () {
            var self = this
            var id = 'id_' + Date.now()
            var content = $.markup('constraint-set-content', { id: id })

            cs(self).plug({
                object: content,
                spool: 'visible'
            })

            var suspend = false
            self.editor = ace.edit(id)
            self.editor.getSession().setMode('ace/mode/cjsc')
            self.editor.on('change', function (ev, editor) {
                if (suspend)
                    return;
                suspend = true
                cs(self).value('data:constraintset', editor.getValue())
                suspend = false
            })

            cs(self).observe({
                name: 'data:constraintset', spool: 'visible',
                touch: true,
                func: function (ev, nVal) {
                    if (suspend)
                        return;
                    suspend = true
                    self.editor.setValue(nVal)
                    self.editor.clearSelection()
                    suspend = false
                }
            })

            cs(self).observe({
                name: 'state:syntactic-errors', spool: 'visible',
                touch: true,
                func: function (ev, errors) {
                    if (errors.length === 0)
                        self.editor.getSession().setAnnotations([])
                    else {
                        errors = _.map(errors, function (error) {
                            return {
                                row: error.line - 1,
                                column: error.column,
                                text: error.message,
                                type: error.type
                            }
                        })
                        self.editor.getSession().setAnnotations(errors)
                    }
                    self.editor.focus()
                }
            })

            cs(self).observe({
                name: 'state:semantic-errors', spool: 'visible',
                touch: true,
                func: function (ev, errors) {
                    if (errors.length === 0)
                        self.editor.getSession().setAnnotations([])
                    else {
                        var linesAry = self.editor.getSession().getValue().split('\n')

                        errors = _.map(errors, function (error) {
                            return {
                                row: _.findIndex(linesAry, function (line) { return line.indexOf(error.constraint.id) !== -1 }),
                                column: error.column,
                                text: error.message,
                                type: error.type
                            }
                        })
                        self.editor.getSession().setAnnotations(errors)
                    }
                    self.editor.focus()
                }
            })
        }
    }
})