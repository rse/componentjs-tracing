/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.vertical.tabs')

app.ui.widget.vertical.tabs.controller = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this
            cs(self).create('model/view',
                app.ui.widget.vertical.tabs.model,
                app.ui.widget.vertical.tabs.view
            )

            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (tabs) {
                    /*  only initialize when nothing in localstorage  */
                    if (cs(self, 'model').value('data:tabs').length === 0)
                        cs(self, 'model').value('data:tabs', tabs)
                }
            })

            cs(self).register({
                name: 'addTab', spool: 'created',
                func: function (tab) {
                    var tabs = cs(self, 'model').value('data:tabs')
                    tabs.push(tab)
                    cs(self, 'model').touch('data:tabs')
                    cs(self, 'model').value('state:active-tab', tabs[tabs.length - 1].id)
                }
            })

            cs(self).register({
                name: 'getActive', spool: 'created',
                func: function () {
                    return cs(self, 'model').value('state:active-tab')
                }
            })

            cs(self).register({
                name: 'removeTab', spool: 'created',
                func: function (tabId) {
                    var tabs = cs(self, 'model').value('data:tabs')
                    tabs = _.filter(tabs, function (tab) { return tab.id !== tabId })
                    cs(self, 'model').value('data:tabs', tabs)
                    cs(self, 'model').value('state:active-tab', tabs[tabs.length - 1].id)
                }
            })
        }
    }
})

app.ui.widget.vertical.tabs.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this

            /*  presentation model for items  */
            cs(self).model({
                'data:tabs'         : { value: [],   valid: '[{ id: string, name: string, enabled: boolean, socket?: string, deleted?: boolean }*]', store: true },
                'state:active-tab'  : { value: '',   valid: 'string', store: true                                                                                },
                'event:tab-checked' : { value: null, valid: '(null | { tabIndex: string, state: boolean })', autoreset: true                                     }
            })

            cs(self).observe({
                name: 'event:tab-checked', spool: 'created',
                func: function (ev, checkEvent) {
                    var tabs = cs(self).value('data:tabs')
                    _.find(tabs,
                        function (tab) { return tab.id === checkEvent.tabIndex }
                    ).enabled = checkEvent.state
                    cs(self).value('data:tabs', tabs, true)
                    cs(self).publish('editorChanged')
                }
            })
        }
    }
})

app.ui.widget.vertical.tabs.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        /*  create tab handle div  */
        fillTabHandle: function (cfg) {
            var self = this
            var newTab = $.markup('vertical-tabs/vertical-tab', { i: cfg.id, name: cfg.name, classes: cfg.classes })
            /*  attach checkbox listener  */
            $('input[type=checkbox]', newTab).prop('checked', cfg.enabled)
            $('input[type=checkbox]', newTab).click(function () {
                cs(self).value('event:tab-checked', { tabIndex: $(this).data('i'), state: $(this).is(':checked')})
            })
            return newTab
        },
        render: function () {
            var self = this

            /*  plug mask into parent  */
            var details = $.markup('vertical-tabs')
            cs(self).plug(details)

            /*  render tabs  */
            cs(self).observe({
                name: 'data:tabs', spool: 'materialized',
                touch: true,
                func: function (ev, tabs) {
                    _.each(tabs, function (tab) {
                        var tabDom = $('.vertical-tabs > .vertical-tab[data-i=' + tab.id + ']', details)
                        var newTab = self.fillTabHandle({ id: tab.id, name: tab.name, enabled: tab.enabled, classes: cs(self).value('state:active-tab') === tab.id ? 'active' : '' })
                        if (tabDom.length === 0) {
                            $('.vertical-tabs', details).append(newTab)
                            /*  create content div  */
                            var content = $('.vertical-contents', details).markup('vertical-tabs/content', { i: tab.id })
                            cs(self).socket({ scope: tab.id, ctx: $(content), type: 'jquery' })
                        }
                        /*  update existing tabs  */
                        else
                            tabDom.replaceWith(newTab)
                    })

                    /*  delete tabs  */
                    var visible = _.map($('.vertical-tabs > .vertical-tab', details), function (item) { return $(item).data('i')})
                    _.each(visible, function (vis) {
                        var res = _.find(tabs, function (tab) { return tab.id === vis })
                        if (!res) {
                            $('.vertical-tabs > .vertical-tab[data-i=' + vis + ']', details).remove()
                            $('.vertical-contents > .vertical-content[data-i=' + vis + ']', details).remove()
                        }
                    })

                    /*  react on tab click  */
                    $('.vertical-tab', details).click(function () {
                        cs(self).value('state:active-tab', $(this).data('i'))
                    })
                }
            })

            /*  react on active tab change  */
            cs(self).observe({
                name: 'state:active-tab', spool: 'materialized',
                touch: true,
                func: function (ev, active) {
                    var tabs = cs(self).value('data:tabs')
                    if (active === '' || _.findIndex(tabs, function (tab) { return tab.id === active }) === -1)
                        active = tabs[0].id
                    _.each(tabs, function (tab) {
                        if (tab.id === active)
                            cs(self, tab.id).state('visible')
                        else
                            cs(self, tab.id).state('prepared')
                    })
                    $('.vertical-tab.active', details).removeClass('active')
                    $('.vertical-tabs > .vertical-tab[data-i=' + active + ']', details).addClass('active')
                    $('.vertical-contents .vertical-content.active', details).removeClass('active')
                    $('.vertical-contents .vertical-content[data-i=' + active + ']', details).addClass('active')

                    ev.result(active)
                }
            })
        }
    }
})