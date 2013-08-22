/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

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

            cs(self, 'model/view/tabs').call('initialize', {
                tabs: [{ id: 'standard', name: 'Standard', enabled: true, data: 'static/cjscp_standard_rules.txt' }],
                domain: 'cjscp'
            })

            cs(self).subscribe({
                name: 'setChanged', spool: 'created',
                func: function (ev, nVal) {
                    cs(self).publish('peepholeConstraintSetChanged', nVal)
                }
            })
        },
        prepare: function () {
            var toolbarItems = [{
                label: 'Add',
                icon: 'plus-sign',
                type: 'button',
                id: 'addBtn',
                click: 'event:add'
            }, {
                label: 'Remove',
                icon: 'minus-sign',
                type: 'button',
                id: 'removeBtn',
                click: 'event:remove'
            }, {
                label: 'Load',
                icon: 'upload-alt',
                type: 'button',
                id: 'loadBtn',
                click: 'event:load'
            }, {
                label: 'Save',
                icon: 'download-alt',
                type: 'button',
                id: 'saveBtn',
                click: 'event:save'
            }]

            cs(this, 'model/view/toolbar').call('initialize', toolbarItems)
        },
        render: function () {
            var self = this
            $('#constraint_upload').change(function (evt) {
                var files = evt.target.files;

                for (var i = 0, f; (f = files[i]); i++) {
                    /* global FileReader: true */
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var content = e.target.result
                            cs(self, 'model/tabs').call('addConstraintset', content)
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#constraint_upload').val('')
                }
            })

            cs(self, 'model').observe({
                name: 'event:add', spool: '..:materialized',
                func: function () {
                    cs(self, 'model/view/tabs').call('addConstraintset', '')
                }
            })

            cs(self, 'model').observe({
                name: 'event:remove', spool: '..:materialized',
                func: function () {
                    /* global confirm: true */
                    if (confirm('Do you want to save this constraint set first?')) {
                        cs(self, 'model/view/tabs').call('saveCurrent')
                        cs(self, 'model/view/tabs').call('removeConstraintset')
                    } else {
                        cs(self, 'model/view/tabs').call('removeConstraintset')
                    }
                }
            })

            cs(self, 'model').observe({
                name: 'event:load', spool: '..:materialized',
                func: function () {
                    $('#constraint_upload').trigger('click')
                }
            })

            cs(self, 'model').observe({
                name: 'event:save', spool: '..:materialized',
                func: function () {
                    cs(self, 'model/view/tabs').call('saveCurrent')
                }
            })
        },
        show: function () {
            var custom = cs(this, 'model').value('state:custom')
            cs(this, 'model/view/tabs').call('addConstraintset', { id: 'custom_' + custom, name: 'Custom ' + custom, enabled: false })
            cs(this, 'model').value('state:custom', custom + 1)
        }
    }
})

app.ui.comp.constraints.peephole.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', true)
            cs(self).model({
                'event:add'    : { value: false,       valid: 'boolean', autoreset: true },
                'event:remove' : { value: false,       valid: 'boolean', autoreset: true },
                'event:load'   : { value: false,       valid: 'boolean', autoreset: true },
                'event:save'   : { value: false,       valid: 'boolean', autoreset: true },
                'state:custom' : { value: 1,           valid: 'number', store: true      }
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