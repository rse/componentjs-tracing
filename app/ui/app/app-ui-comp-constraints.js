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
    dynamics: {
        domain: null
    },
    cons: function (dom) {
        this.domain = dom
    },
    protos: {
        create: function () {
            var self = this

            cs(self).create('{toolbarModel/view/,tabs}',
                app.ui.widget.toolbar.model,
                app.ui.widget.toolbar.view,
                app.ui.widget.vertical.tabs.controller
            )

            var standard = 'static/' + self.domain + '_standard_rules.txt'
            cs(self).model({
                'event:add' :          { value: false, valid: 'boolean', autoreset: true },
                'event:remove' :       { value: false, valid: 'boolean', autoreset: true },
                'event:load' :         { value: false, valid: 'boolean', autoreset: true },
                'event:save' :         { value: false, valid: 'boolean', autoreset: true },
                'state:highlighting' : { value: self.domain, valid: 'string'             },
                'data:standard' :      { value: standard, valid: 'string'                }
            })

            cs(self).subscribe({
                name: 'setChanged', spool: 'created',
                func: function (ev, nVal) {
                    if (cs(self).value('state:highlighting') === 'cjscp') {
                        var merged = _.flatten(nVal)
                        var sorted = app.lib.sorter(merged)
                        cs(self, '..').publish('constraintSetChanged', sorted)
                    }
                    else
                        cs(self, '..').publish('temporalConstraintSetChanged', nVal)
                }
            })
        },
        prepare: function () {
            var toolbarItems = [{
                label: 'Add',
                icon: "plus-sign",
                type: 'button',
                id: 'addBtn'
            }, {
                label: 'Remove',
                icon: "minus-sign",
                type: 'button',
                id: 'removeBtn'
            }, {
                label: 'Load',
                icon: 'upload-alt',
                type: 'button',
                id: 'loadBtn'
            }, {
                label: 'Save',
                icon: 'download-alt',
                type: 'button',
                id: 'saveBtn'
            }]

            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/addBtn',    value: 'event:add'    })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/loadBtn',   value: 'event:load'   })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/saveBtn',   value: 'event:save'   })
            cs(this).property({ name: 'clicked', scope: 'toolbarModel/view/removeBtn', value: 'event:remove' })

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
                scope: 'tabs',
                ctx: $('.vertical-tabs-container', content)
            })

            cs(self).plug(content)

            $('#constraint_upload').change(function (evt) {
                var files = evt.target.files;

                for (var i = 0, f; (f = files[i]); i++) {
                    /* global FileReader: true */
                    var reader = new FileReader()
                    reader.onload = (function () {
                        return function (e) {
                            var content = e.target.result
                            cs(self, 'tabs').call('addConstraintset', content)
                        }
                    })(f)

                    reader.readAsText(f)
                    $('#constraint_upload').val('')
                }
            })

            cs(self).observe({
                name: 'event:add', spool: 'rendered',
                func: function () {
                    cs(self, 'tabs').call('addConstraintset', '')
                }
            })

            cs(self).observe({
                name: 'event:remove', spool: 'rendered',
                func: function () {
                    /* global confirm: true */
                    if (confirm('Do you want to save this constraint set first?')) {
                        cs(self, 'tabs').call('saveCurrent')
                        cs(self, 'tabs').call('removeConstraintset')
                    } else {
                        cs(self, 'tabs').call('removeConstraintset')
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
                    cs(self, 'tabs').call('saveCurrent')
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})
