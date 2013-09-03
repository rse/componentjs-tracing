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
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        icon: null,
        btn: null,
        stateClass: null
    },
    protos: {
        create: function () {
            var self = this
            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (cfg) {
                    self.label = cfg.label
                    self.icon = cfg.icon
                    self.stateClass = cfg.stateClass
                }
            })
        },
        prepare: function (){
            var self = this
            self.btn = $.markup('toolbar-button', { label: self.label, icon: self.icon })

            cs(self).plug({
                object: self.btn,
                spool: 'prepared'
            })
        },
        show: function () {
            var self = this
            var state = cs(self).property('state')
            if (state)
                cs(self).observe({
                    name: state, spool: 'visible',
                    touch: true,
                    func: function (ev, nVal) {
                        if (nVal) {
                            if (self.stateClass)
                                $('.icon', self.btn).addClass(self.stateClass)
                            $(self.btn).addClass('pressed')
                        }
                        else {
                            if (self.stateClass)
                                $('.icon', self.btn).removeClass(self.stateClass)
                            $(self.btn).removeClass('pressed')
                        }
                    }
                })

            $(self.btn).click(function () {
                cs(self).value(cs(self).property('click'), true)
            })
        }
    }
})

/*  input view  */
app.ui.widget.toolbar.items.input = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        input: null
    },
    protos: {
        prepare: function () {
            var self = this
            self.input = $.markup('toolbar-input')
            cs(self).plug({
                object: self.input,
                spool: 'prepared'
            })
        },
        show: function () {
            var self = this
            $('input[type=text]', self.input).change(function (event) {
                cs(self).value(cs(self).property('data'), event.target.value)
            })

            $('input[type=text]', self.input).keyup(function (event) {
                cs(self).value(cs(self).property('keyup'), event.keyCode)
            })

            cs(self).observe({
                name: cs(self).property('data'), spool: 'visible',
                touch: true,
                func: function (ev, nVal) {
                    $('input[type=text]', self.input).val(nVal)
                }
            })
        }
    }
})

/*  text view  */
app.ui.widget.toolbar.items.text = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        icon:  null,
        text: null
    },
    protos: {
        create: function () {
            var self = this
            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (cfg) {
                    self.label = cfg.label
                    self.icon = cfg.icon
                }
            })
        },
        prepare: function () {
            var self = this
            self.text = $.markup('toolbar-text', { label: self.label, icon: self.icon })
            cs(self).plug({
                object: self.text,
                spool: 'prepared'
            })
        }
    }
})

/*  checkbox view  */
app.ui.widget.toolbar.items.checkbox = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        label: null,
        icon: null,
        btn: null
    },
    protos: {
        create: function () {
            var self = this
            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (cfg) {
                    self.label = cfg.label
                    self.icon = cfg.icon
                }
            })
        },
        prepare: function () {
            var self = this

            self.btn = $.markup('toolbar-checkbox', { id: Date.now(), label: self.label, icon: self.icon })

            cs(self).plug({
                object: self.btn,
                spool: 'prepared'
            })
        },
        show: function () {
            var self = this
            $('input[type=checkbox]', self.btn).click(function () {
                cs(self).value(cs(self).property('data'), $('input[type=checkbox]', self.btn).is(':checked'))
            })

            cs(self).observe({
                name: cs(self).property('data'), spool: 'visible',
                touch: true,
                func: function (ev, nVal) {
                    $('input[type=checkbox]', self.btn).attr('checked', nVal)
                }
            })
        }
    }
})