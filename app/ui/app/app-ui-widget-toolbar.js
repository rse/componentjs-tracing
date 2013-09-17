/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.widget.toolbar = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', true)
            cs(self).create('model/view',
                app.ui.widget.toolbar.model,
                app.ui.widget.toolbar.view
            )
            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (items) {
                    cs(self, 'model').value('data:items', items)
                }
            })
        },
        render: function () {
            var self = this
            cs(self, 'model').observe({
                name: 'data:items', spool: 'materialized',
                touch: true,
                func: function (ev, nVal) {
                    _.each(nVal, function (item, idx) {
                        var cmp
                        if (item.type === 'button') {
                            if (!item.id)
                                item.id = 'button-' + idx
                            cmp = cs(self, 'model/view').create(item.id, app.ui.widget.toolbar.items.button)
                            cmp.call('initialize', { label: item.label, icon: item.icon, stateClass: item.stateClass })
                        }
                        else if (item.type === 'input') {
                            if (!item.id)
                                item.id = 'input-' + idx
                            cmp = cs(self, 'model/view').create(item.id, app.ui.widget.toolbar.items.input)
                        }
                        else if (item.type === 'text') {
                            if (!item.id)
                                item.id = 'text-' + idx
                            cmp = cs(self, 'model/view').create(item.id, app.ui.widget.toolbar.items.text)
                            cmp.call('initialize', { label: item.label, icon: item.icon })
                        }
                        else if (item.type === 'checkbox') {
                            if (!item.id)
                                item.id = 'checkbox-' + idx
                            cmp = cs(self, 'model/view').create(item.id, app.ui.widget.toolbar.items.checkbox)
                            cmp.call('initialize', { label: item.label, icon: item.icon })
                        }
                        if (item.pressedIcon)
                            cmp.value('data:pressed-icon', item.pressedIcon)
                    })
                }
            })
        },
        release: function () {
            var self = this
            _.each(cs(self, 'model').value('data:items'), function (cfg) {
                cs(self, 'model/view/' + cfg.id).destroy()
            })
        }
    }
})

app.ui.widget.toolbar.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this
            /*  presentation model for items  */
            cs(self).model({
                'data:items': { value: [], valid: '[{ label?: string, icon?: string, type: string, id?: string,' +
                    ' click?:string, data?:string, keyup?:string, state?:string, stateClass?:string }*]' },
                'data:rendered': { value: [], valid: '[string*]' }
            })

            cs(self).observe({
                name: 'data:items', spool: 'created',
                func: function (ev, items) {
                    _.each(items, function (item) {
                        if (item.click)
                            cs(self).property({ name: 'click', scope: 'view/' + item.id, value: item.click })
                        if (item.keyup)
                            cs(self).property({ name: 'keyup', scope: 'view/' + item.id, value: item.keyup })
                        if (item.data)
                            cs(self).property({ name: 'data', scope: 'view/' + item.id, value: item.data })
                        if (item.state)
                            cs(self).property({ name: 'state', scope: 'view/' + item.id, value: item.state })
                    })
                }
            })
        }
    }
})

/*  widget view  */
app.ui.widget.toolbar.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this

            /*  plug mask into parent  */
            var content = $.markup('widget-toolbar')

            cs(self).plug(content)

            cs(self).socket({
                ctx: $('.items', content)
            })
        }
    }
})