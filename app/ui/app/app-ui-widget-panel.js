/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.panel')

/*  widget model  */
app.ui.widget.panel.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            /*  presentation model for tabs  */
            cs(this).model({
                'data:tabs'        : { value: [], valid: '[{ id: string, name: string, icon: string, classes?: string }*]' },
                'state:active-tab' : { value: -1, valid: 'number', store: true                                             }
            })
        }
    }
})

/*  widget view  */
app.ui.widget.panel.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        ui: null
    },
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
        },
        render: function () {
            var self = this

            /*  plug mask into parent  */
            self.ui = $.markup('widget-panel')
            cs(self).plug(self.ui);

            cs(this).socket({
                ctx: $('#statusbar-container'),
                scope: 'statusbar'
            })

            /*  render tabs  */
            var tab2socket = []
            cs(self).observe({
                name: 'data:tabs', spool: 'materialized',
                touch: true,
                func: function (ev, tabs) {
                    /*  remove potentially still existing tabs  */
                    var i
                    if (tab2socket.length > 0) {
                        $('.tabs > *', self.ui).remove()
                        $('.content > *', self.ui).remove()
                        for (i = 0; i < tab2socket.length; i++)
                            cs(self).unsocket(tab2socket[i])
                        tab2socket = []
                    }

                    /*  render new tabs  */
                    for (i = 0; i < tabs.length; i++) {
                        $('.tabs', self.ui).markup('widget-panel/tab', { i: i, name: tabs[i].name, icon: tabs[i].icon, classes: tabs[i].classes })
                        var content = $('.contents', self.ui).markup('widget-panel/content')
                        var id = cs(self).socket({ scope: tabs[i].id, ctx: $(content), type: 'jquery' })
                        tab2socket.push(id)
                    }

                    /*  enforce active tab  */
                    if (cs(self).value('state:active-tab') > tab2socket.length - 1)
                        cs(self).value('state:active-tab', tab2socket.length - 1)
                    else
                        cs(self).touch('state:active-tab')
                }
            })

            /*  react on tab click  */
            $('.tabs .tab').click(function () {
                cs(self).value('state:active-tab', $(this).data('i'))
            })
        },
        show: function () {
            var self = this
            /*  react on active tab change  */
            cs(self).observe({
                name: 'state:active-tab', spool: 'visible',
                touch: true,
                func: function (ev, active) {
                    if (active > cs(self).value('data:tabs').length)
                        throw new Error('invalid tab number to activate')
                    if (active < 0)
                        active = 0
                    $('.tabs .tab.active', self.ui).removeClass('active')
                    $('.tabs .tab', self.ui).eq(active).addClass('active')
                    $('.contents .content.active', self.ui).removeClass('active')
                    $('.contents .content', self.ui).eq(active).addClass('active')
                    var toHide = _.filter(cs(self).value('data:tabs'), function (tab, idx) { return idx !== active })
                    _.each(toHide, function (tab) {
                        cs(self, tab.id).state('prepared')
                    })
                    cs(self, cs(self).value('data:tabs')[active].id).state('visible')

                }
            })
        }
    }
})