/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.comp.constraints = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            cs(this).create('{toolbarModel/view/,constraintset}',
                app.ui.widget.toolbar.model,
                app.ui.widget.toolbar.view,
                app.ui.widget.vertical.tabs.controller
            )

            cs(this).model({
                'event:add'     : { value: false, valid: 'boolean', autoreset: true },
                'event:remove'  : { value: false, valid: 'boolean', autoreset: true },
                'event:load'    : { value: false, valid: 'boolean', autoreset: true },
                'event:save'    : { value: false, valid: 'boolean', autoreset: true }
            })
        },
        prepare: function () {
            var toolbarItems = [{
                label: 'Add',
                event: 'event:add',
                type: 'button'
            }, {
                label: 'Remove',
                event: 'event:remove',
                type: 'button'
            }, {
                label: 'Load',
                event: 'event:load',
                type: 'button'
            }, {
                label: 'Save',
                event: 'event:save',
                type: 'button'
            }]

            cs(this, 'toolbarModel').value('data:items', toolbarItems)
        },
        render: function () {
            var self = this
            var content = $.markup("constraints-content")

            cs(self).socket({
                scope: 'toolbarModel/view',
                ctx: $('.toolbar', content)
            })

            cs(self).socket({
                scope: 'constraintset',
                ctx: $('.vertical-tabs-container', content)
            })

            cs(self).plug(content)

            $('#constraint_upload').change(function (evt) {
                var files = evt.target.files;

                for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var content = e.target.result
                            cs(self, 'constraintset').call('addConstraintset', content)
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#constraint_upload').val('')
                }
            })

            cs(self).observe({
                name: 'event:add', spool: 'rendered',
                func: function () {
                    cs(self, 'constraintset').call('addConstraintset', '')
                }
            })

            cs(self).observe({
                name: 'event:remove', spool: 'rendered',
                func: function () {
                    if (confirm('Do you want to save this constraint set first?')) {
                        cs(self, 'constraintset').call('saveCurrent')
                        cs(self, 'constraintset').call('removeConstraintset')
                    } else {
                        cs(self, 'constraintset').call('removeConstraintset')
                    }
                }
            })

            cs(self).observe({
                name: 'event:load', spool: 'rendered',
                func: function () {
                    $('#constraint_upload').trigger('click')
                }
            })

            cs(self).observe({
                name: 'event:save', spool: 'rendered',
                func: function () {
                    cs(self, 'constraintset').call('saveCurrent')
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})