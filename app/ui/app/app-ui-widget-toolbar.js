/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns("app.ui.widget.toolbar")

app.ui.widget.toolbar.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            /*  presentation model for items  */
            cs(this).model({
                "data:items": { value: [], valid: '[(any | { source: string, sourceType: string, ' +
                    'origin: string, originType: string, operation: string, parameters: any})*]' } /* FIXME: wrong fields! */
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
            var content = $.markup("widget-toolbar")

            cs(self).plug(content)

            cs(self).socket({
                ctx: $('.items', content)
            })

            cs(self).observe({
                name: 'data:items', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    for (var i = 0; i < nVal.length; i++) {
                        var item = nVal[i];
                        if (item.type === 'button') {
                            var btn =  new app.ui.widget.toolbar.items.button(item.label, item.event, item.icon)
                            if (!item.id)
                                item.id = 'button-' + i
                            cs(self).create(item.id, btn)
                            if (item.pressedIcon)
                                cs(self, item.id).value('data:pressed-icon', item.pressedIcon)
                        }
                        else if (item.type === 'input') {
                            var input =  new app.ui.widget.toolbar.items.input(item.data, item.event)
                            if (!item.id)
                                item.id = 'input-' + i
                            cs(self).create(item.id, input)
                        }
                        else if (item.type === 'text') {
                            var text =  new app.ui.widget.toolbar.items.text(item.label, item.icon)
                            cs(self).create('text-' + i, text)
                        }
                        else if (item.type === 'checkbox') {
                            var checkbox =  new app.ui.widget.toolbar.items.checkbox(item.label, item.data, item.icon)
                            if (!item.id)
                                item.id = 'checkbox-' + i
                            cs(self).create(item.id, checkbox)
                        }
                        else
                            $('.items', content).markup('widget-toolbar/item', { content: item.label })
                    }
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})