/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.toolbar.items')

/*  button view  */
app.ui.widget.toolbar.items.button = cs.clazz({
    mixin: [ cs.marker.view, cs.marker.model ],
    dynamics: {
        label: null,
        icon: null
    },
    cons: function (label, icon) {
        this.label = label
        this.icon  = icon
    },
    protos: {
        create: function () {
            var self = this

            cs(self).model({
                'state:pressed': { value: false, valid: 'boolean' }
            })

            var btn = $.markup('toolbar-button', { label: self.label, icon: self.icon })

            cs(self).observe({
                name: 'state:pressed', spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    if (nVal)
                        $(btn).addClass('pressed')
                    else
                        $(btn).removeClass('pressed')
                }
            })

            $(btn).click(function () {
                cs(self).value(cs(self).property('clicked'), true)
            })

            cs(self).plug(btn)
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

/*  input view  */
app.ui.widget.toolbar.items.input = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        create: function () {
            var self = this

            var btn = $.markup('toolbar-input')

            $('input[type=text]', btn).change(function (event) {
                cs(self).value(cs(self).property('data'), event.target.value)
            })

            $('input[type=text]', btn).keyup(function (event) {
                cs(self).value(cs(self).property('keyup'), event.keyCode)
            })

            cs(self).observe({
                name: cs(self).property('data'), spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    $('input[type=text]', btn).val(nVal)
                }
            })

            cs(self).plug(btn)
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

/*  text view  */
app.ui.widget.toolbar.items.text = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        icon:  null
    },
    cons: function (label, icon) {
        this.label = label
        this.icon  = icon
    },
    protos: {
        create: function () {
            var self = this

            var btn = $.markup('toolbar-text', { label: self.label, icon: self.icon })

            cs(self).plug(btn)
        }
    }
})

/*  checkbox view  */
app.ui.widget.toolbar.items.checkbox = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        icon: null
    },
    cons: function (label, icon) {
        this.label =  label
        this.icon = icon
    },
    protos: {
        create: function () {
            var self = this

            var btn = $.markup('toolbar-checkbox', { id: Date.now(), label: self.label, icon: self.icon })

            $('input[type=checkbox]', btn).click(function () {
                cs(self).value(cs(self).property('data'), $('input[type=checkbox]', btn).is(':checked'))
            })

            cs(self).observe({
                name: cs(self).property('data'), spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    $('input[type=checkbox]', btn).attr('checked', nVal)
                }
            })

            cs(self).plug(btn)
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})