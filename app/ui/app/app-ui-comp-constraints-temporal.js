/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.comp.constraints')

app.ui.comp.constraints.temporal = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', false)

            cs(self).create('model/view/{toolbar,constraintset}',
                app.ui.comp.constraints.temporal.model,
                app.ui.comp.constraints.temporal.view,
                app.ui.widget.toolbar,
                app.ui.widget.constraintset
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
                    var result = cs('/sv').call('parseTemporalConstraintset', content)
                    if (result.success) {
                        cs(self, 'model/view/constraintset').call('displaySyntacticError', [])
                        cs(self, 'model').value('state:status', '')

                        /*  check for semantic correctness in temporal constraints  */
                        var errors = cs('/sv').call('validateTemporalConstraints', result.constraints)

                        if (errors.length !== 0) {
                            cs(self, 'model/view/constraintset').call('displaySemanticError', errors)
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
                        else
                            cs(self).publish('temporalConstraintSetChanged', result.constraints)
                    }
                    else {
                        result.error.expected = _.filter(result.error.expected, function (exp) { return exp !== '[ \\t\\r\\n]' })
                        result.error.type = 'error'
                        result.error.message = 'Expected ' + result.error.expected.join(' or ') + ' but "' + result.error.found + '" found.'
                        cs(self, 'model/view/constraintset').call('displaySyntacticError', [ result.error ])
                        cs(self, 'model').value('state:status', result.error.message)
                    }
                }
            })

            /*  only load the default constraintset, when there is non in the local storage  */
            if (cs(self, 'model/view/constraintset').call('getContent') === '')
                $.get('static/cjsct_standard_rules.txt', function (content) {
                    cs(self, 'model/view/constraintset').call('setContent', content)
                })
        },
        prepare: function () {
            var toolbarItems = [{
                label: 'Save',
                icon: 'download-alt',
                type: 'button',
                id: 'saveBtn',
                click: 'event:save'
            },{
                label: 'Load',
                icon: 'upload-alt',
                type: 'button',
                id: 'loadBtn',
                click: 'event:load'
            },{
                label: 'Default',
                icon: 'undo',
                type: 'button',
                id: 'defaultBtn',
                click: 'event:default'
            }]

            cs(this, 'model/view/toolbar').call('initialize', toolbarItems)
        },
        show: function () {
            var self = this
            $('#temporal_constraint_upload').change(function (evt) {
                var files = evt.target.files
                for (var i = 0, f; (f = files[i]); i++) {
                    /* global FileReader: true */
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var content = e.target.result
                            cs(self, 'model/view/constraintset').call('setContent', content)
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#temporal_constraint_upload').val('')
                }
            })

            cs(self, 'model').observe({
                name: 'event:default', spool: '..:visible',
                func: function () {
                    $.get('static/cjsct_standard_rules.txt', function (content) {
                        cs(self, '//constraintset').call('setContent', content)
                    })
                }
            })

            cs(self, 'model').observe({
                name: 'event:load', spool: '..:visible',
                func: function () {
                    $('#temporal_constraint_upload').trigger('click')
                }
            })

            cs(self, 'model').observe({
                name: 'event:save', spool: '..:visible',
                func: function () {
                    var content = cs(self, 'model/view/constraintset').call('getContent')
                    /* global btoa: true */
                    window.location = 'data:application/octet-stream;base64,' + btoa(content)
                }
            })
        },
        hide: function () {
            cs(this, 'model').value('state:status', '')
        }
    }
})

app.ui.comp.constraints.temporal.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', true)
            cs(self).model({
                'event:load'    : { value: false, valid: 'boolean', autoreset: true },
                'event:default' : { value: false, valid: 'boolean', autoreset: true },
                'event:save'    : { value: false, valid: 'boolean', autoreset: true },
                'state:status'  : { value: '',    valid: 'string',                  }
            })
        }
    }
})

app.ui.comp.constraints.temporal.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            var content = $.markup('temporal-content')
            cs(this).socket({
                scope: 'toolbar',
                ctx: $('.toolbar', content)
            })

            cs(this).socket({
                scope: 'constraintset',
                ctx: $('.constraints', content)
            })

            cs(this).plug({
                object: content,
                spool: 'materialized'
            })
        }
    }
})