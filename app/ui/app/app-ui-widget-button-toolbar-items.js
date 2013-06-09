/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns("app.ui.widget.toolbar.items")

/*  button view  */
app.ui.widget.toolbar.items.button = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        eventBinding: null
    },
    cons: function (label, eventBinding) {
        this.label = label
        this.event = eventBinding
    },
    protos: {
        create: function () {
            var self = this

            var btn = $.markup("toolbar-button", { label: self.label })

            $(btn).click(function () {
                cs(self).value(self.event, true)
            })

            cs(self).plug(btn);
        },
        release: function () {
        }
    }
})

/*  input view  */
app.ui.widget.toolbar.items.input = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        dataBinding: null,
        eventBinding: null
    },
    cons: function (dataBinding, eventBinding) {
        this.dataBinding = dataBinding
        this.eventBinding = eventBinding
    },
    protos: {
        create: function () {
            var self = this

            var btn = $.markup("toolbar-input")

            $('input[type=text]', btn).keyup(function (event) {
                if (event.keyCode === 13) {
                    cs(self).value(self.dataBinding, event.target.value)
                }
            })

            $('input[type=text]', btn).keyup(function (event) {
                cs(self).value(self.eventBinding, event.keyCode)
            })

            cs(self).observe({
                name: self.dataBinding, spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    $('input[type=text]', btn).val(nVal)
                }
            })

            cs(self).plug(btn);
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
        label: null
    },
    cons: function (label) {
        this.label =  label
    },
    protos: {
        create: function () {
            var self = this

            var btn = $.markup("toolbar-text", { label: self.label })

            cs(self).plug(btn);
        },
        release: function () {
        }
    }
})

/*  checkbox view  */
app.ui.widget.toolbar.items.checkbox = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        dataBinding: null
    },
    cons: function (label, binding) {
        this.label =  label
        this.dataBinding = binding
    },
    protos: {
        create: function () {
            var self = this

            var btn = $.markup("toolbar-checkbox", { id: Date.now(), label: self.label })

            $('input[type=checkbox]', btn).click(function () {
                cs(self).value(self.dataBinding, $('input[type=checkbox]', btn).is(':checked'))
            })

            cs(self).plug(btn);
        },
        release: function () {
        }
    }
})