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
                    _.each(items, function (item) {
                        if (item.click)
                            cs(self).property({ name: 'click', scope: 'model/view/' + item.id, value: item.click })
                        if (item.keyup)
                            cs(self).property({ name: 'keyup', scope: 'model/view/' + item.id, value: item.keyup })
                        if (item.data)
                            cs(self).property({ name: 'data', scope: 'model/view/' + item.id, value: item.data })
                        if (item.state)
                            cs(self).property({ name: 'state', scope: 'model/view/' + item.id, value: item.state })
                    })
                    cs(self, 'model').value('data:items', items)
                }
            })
        }
    }
})

app.ui.widget.toolbar.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            /*  presentation model for items  */
            cs(this).model({
                'data:items': { value: [], valid: '[{ label?: string, icon?: string, type: string, id?: string,' +
                    ' click?:string, data?:string, keyup?:string, state?:string, stateClass?:string }*]' },
                'data:rendered': { value: [], valid: '[string*]' }
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

            cs(self).observe({
                name: 'data:items', spool: 'materialized',
                touch: true,
                func: function (ev, nVal) {
                    for (var i = 0; i < nVal.length; i++) {
                        var item = nVal[i]
                        var cmp
                        if (item.type === 'button') {
                            if (!item.id)
                                item.id = 'button-' + i
                            cmp = cs(self).create(item.id, app.ui.widget.toolbar.items.button)
                            cmp.call('initialize', { label: item.label, icon: item.icon, stateClass: item.stateClass })
                        }
                        else if (item.type === 'input') {
                            if (!item.id)
                                item.id = 'input-' + i
                            cmp = cs(self).create(item.id, app.ui.widget.toolbar.items.input)
                        }
                        else if (item.type === 'text') {
                            if (!item.id)
                                item.id = 'text-' + i
                            cmp = cs(self).create(item.id, app.ui.widget.toolbar.items.text)
                            cmp.call('initialize', { label: item.label, icon: item.icon })
                        }
                        else if (item.type === 'checkbox') {
                            if (!item.id)
                                item.id = 'checkbox-' + i
                            cmp = cs(self).create(item.id, app.ui.widget.toolbar.items.checkbox)
                            cmp.call('initialize', { label: item.label, icon: item.icon })
                        }
                        if (item.pressedIcon)
                            cmp.value('data:pressed-icon', item.pressedIcon)
                    }
                }
            })
        },
        release: function () {
            var self = this
            _.each(cs(self).value('data:items'), function (cfg) {
                cs(self, cfg.id).destroy()
            })
        }
    }
})