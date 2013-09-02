/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global confirm: true, btoa: true */
app.ui.comp.constraints.peephole = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', false)

            cs(self).create('model/view/{toolbar,tabs}',
                app.ui.comp.constraints.peephole.model,
                app.ui.comp.constraints.peephole.view,
                app.ui.widget.toolbar,
                app.ui.widget.vertical.tabs.controller
            )

            cs(self, 'model').observe({
                name: 'state:status', spool: 'created',
                func: function (ev, status) {
                    cs(self).publish('event:status-message', status)
                }
            })

            cs(self).subscribe({
                name: 'setChanged', spool: 'created',
                func: function (ev, content) {
                    var result = cs('/sv').call('parsePeepholeConstraintset', content)
                    if (result.success) {
                        ev.target().call('displaySyntacticError', [])
                        cs(self, 'model').value('state:status', '')

                        /*  check for semantic correctness in temporal constraints  */
                        var errors = cs('/sv').call('validatePeepholeConstraints', result.constraints)

                        if (errors.length !== 0) {
                            ev.target().call('displaySemanticError', errors)
                            var warningCnt = 0
                            var errorCnt = 0
                            _.each(errors, function (err) {
                                if (err.type === 'error')
                                    errorCnt++
                                else
                                    warningCnt++
                            })
                            var message = 'You have ' + (errorCnt > 0 ? errorCnt + ' semantic error' + (errorCnt > 1 ? 's' : '') : '')
                            message += (warningCnt > 0 ? ' and ' + warningCnt + ' semantic warning' + (warningCnt > 1 ? 's' : '') : '')
                            cs(self, 'model').value('state:status', message)
                        }
                        else {
                            var constraints = []
                            _.each(['standard'].concat(cs(self, 'model').value('data:tabs')), function (tab) {
                                constraints = constraints.concat(cs('/sv').call('parsePeepholeConstraintset', cs(self, '//' + tab).call('getContent')).constraints)
                            })
                            cs(self).publish('peepholeConstraintSetChanged', constraints)
                        }
                    }
                    else {
                        result.error.expected = _.filter(result.error.expected, function (exp) { return exp !== '[ \\t\\r\\n]' })
                        result.error.type = 'error'
                        result.error.message = 'Expected ' + result.error.expected.join(' or ') + ' but "' + result.error.found + '" found.'
                        ev.target().call('displaySyntacticError', [ result.error ])
                        cs(self, 'model').value('state:status', result.error.message)
                    }
                }
            })

            cs(self, 'model/view/tabs').call('initialize',
                [{ id: 'standard', name: 'Standard', enabled: true }]
            )
            cs(self, '//tabs/model/view').create('standard', app.ui.widget.constraintset)
            /*  only load the default constraintset, when there is non in the local storage  */
            if (cs(self, '//standard').call('getContent') === '')
                $.get('static/cjscp_standard_rules.txt', function (content) {
                    cs(self, '//standard').call('setContent', content)
                })
        },
        prepare: function () {
            var self = this
            var toolbarItems = [{
                label: 'Add',
                icon: 'plus-sign',
                type: 'button',
                id: 'addBtn',
                click: 'event:add'
            },{
                label: 'Remove',
                icon: 'minus-sign',
                type: 'button',
                id: 'removeBtn',
                click: 'event:remove'
            },{
                label: 'Load',
                icon: 'upload-alt',
                type: 'button',
                id: 'loadBtn',
                click: 'event:load'
            },{
                label: 'Save',
                icon: 'download-alt',
                type: 'button',
                id: 'saveBtn',
                click: 'event:save'
            },{
                label: 'Default',
                icon: 'undo',
                type: 'button',
                id: 'defaultBtn',
                click: 'event:default'
            }]

            cs(self, 'model/view/toolbar').call('initialize', toolbarItems)
            var tabs = cs(self, 'model').value('data:tabs')
            _.each(tabs, function (tab) {
                cs(self, '//tabs/model/view').create(tab, app.ui.widget.constraintset)
            })
        },
        show: function () {
            var self = this
            $('#constraint_upload').change(function (evt) {
                var files = evt.target.files;

                for (var i = 0, f; (f = files[i]); i++) {
                    /* global FileReader: true */
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var content = e.target.result
                            var custom = cs(self,'model').value('state:custom')
                            cs(self, '//tabs/model/view').create('custom_' + custom, app.ui.widget.constraintset)
                            cs(self, '//tabs').call('addTab', { id: 'custom_' + custom, name: 'Custom ' + custom, enabled: false })
                            cs(self, '//custom_' + custom).call('setContent', content)
                            cs(self,'model').value('state:custom', custom + 1)
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#constraint_upload').val('')
                }
            })

            cs(self, 'model').observe({
                name: 'event:add', spool: '..:visible',
                func: function () {
                    var custom = cs(self,'model').value('state:custom')
                    cs(self, '//tabs/model/view').create('custom_' + custom, app.ui.widget.constraintset)
                    cs(self, '//tabs').call('addTab', { id: 'custom_' + custom, name: 'Custom ' + custom, enabled: false })
                    cs(self,'model').value('data:tabs').push('custom_' + custom)
                    cs(self,'model').value('state:custom', custom + 1)
                }
            })

            var saveCurrent = function () {
                var content = cs(self, '//' + cs(self, '//tabs').call('getActive')).call('getContent')
                window.location = 'data:application/octet-stream;base64,' + btoa(content)
            }

            cs(self, 'model').observe({
                name: 'event:remove', spool: '..:visible',
                func: function () {
                    var active = cs(self, '//tabs').call('getActive')
                    if (active === 'standard')
                        return
                    if (confirm('Do you want to save this constraint set first?')) {
                        saveCurrent()
                    }
                    cs(self, '//tabs').call('removeTab', active)
                    cs(self, '//' + active).destroy()
                    cs(self,'model').value('data:tabs', _.without(cs(self,'model').value('data:tabs'), active))
                }
            })

            cs(self, 'model').observe({
                name: 'event:load', spool: '..:visible',
                func: function () {
                    $('#constraint_upload').trigger('click')
                }
            })

            cs(self, 'model').observe({
                name: 'event:default', spool: '..:visible',
                func: function () {
                    $.get('static/cjscp_standard_rules.txt', function (content) {
                        cs(self, '//standard').call('setContent', content)
                    })
                }
            })

            cs(self, 'model').observe({
                name: 'event:save', spool: '..:visible',
                func: function () {
                    saveCurrent()
                }
            })
        },
        hide: function () {
            cs(this, 'model').value('state:status', '')
        }
    }
})

app.ui.comp.constraints.peephole.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(this).model({
                'event:add'     : { value: false, valid: 'boolean', autoreset: true },
                'event:remove'  : { value: false, valid: 'boolean', autoreset: true },
                'event:load'    : { value: false, valid: 'boolean', autoreset: true },
                'event:default' : { value: false, valid: 'boolean', autoreset: true },
                'event:save'    : { value: false, valid: 'boolean', autoreset: true },
                'state:custom'  : { value: 1,     valid: 'number',  store: true     },
                'data:tabs'     : { value: [],    valid: '[string*]', store: true   },
                'state:status'  : { value: '',    valid: 'string',                  }
            })
        }
    }
})

app.ui.comp.constraints.peephole.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            var content = $.markup('constraints-content')

            cs(this).socket({
                scope: 'toolbar',
                ctx: $('.toolbar', content)
            })
            cs(this).socket({
                scope: 'tabs',
                ctx: $('.vertical-tabs-container', content)
            })

            cs(this).plug({
                object: content,
                spool: 'materialized'
            })
        }
    }
})