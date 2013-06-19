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
    dynamics: {
        customs: 0,
        timer: null
    },
    protos: {
        create: function () {
            cs(this).create('tabsModel/view',
                app.ui.widget.vertical.tabs.model,
                app.ui.widget.vertical.tabs.view
            )
        },
        prepare: function () {
            var self = this

            var tabs = cs(self, 'tabsModel').value('data:tabs')
            if (tabs.length === 0) {
                cs(self, 'tabsModel').value('data:tabs', [
                    { id: 'standard', name: 'Standard', enabled: true }
                ])
            }
            else {
                for (var i = 0; i < tabs.length; i++) {
                    delete tabs[i].socket
                }
                cs(self, 'tabsModel').value('data:tabs', tabs, true)
            }

            $.get('static/standard_rules.txt', function (data) {
                cs(self, 'tabsModel/view/standard').value('data:constraintset', data)
            })

            cs(self).subscribe({
                name: 'editorChanged', spool: 'prepared',
                func: function (/* ev */) {
                    if (self.timer !== null) {
                        /* global clearTimeout: true */
                        clearTimeout(self.timer)
                    }
                    /* global setTimeout: true */
                    self.timer = setTimeout(function () {
                        cs(self).call('parseConstraintsets')
                    }, 1000)
                }
            })

            cs(self).register({
                name: 'parseConstraintsets', spool: 'prepared',
                func: function () {
                    var tabs = cs(self, 'tabsModel').value('data:tabs')
                    var constraintsets = []

                    for (var i = 0; i < tabs.length; i++) {
                        var tab = cs(self, 'tabsModel/view/' + tabs[i].id)
                        var content = tab.value('data:savable')
                        var result = cs('/sv').call('parseConstraintset', content)


                        if (result.success) {
                            tab.call('displayError', null)
                            if (tabs[i].enabled)
                                constraintsets.push(result.constraints)
                        }
                        else
                            tab.call('displayError', result.error)
                    }
                    var merged = _.flatten(constraintsets)
                    var sorted = app.lib.sorter(merged)

                    cs(self).publish('constraintSetChanged', sorted)
                }
            })
        },
        render: function () {
            var self = this

            cs(self).register({
                name: 'saveCurrent', spool: 'rendered',
                func: function () {
                    var content = cs(self, 'tabsModel').value('data:savable')
                    /* global btoa: true */
                    window.location = 'data:application/octet-stream;base64,' + btoa(content)
                }
            })

            cs(self).register({
                name: 'addConstraintset', spool: 'rendered',
                func: function (/* content */) {
                    var current = cs(self, 'tabsModel').value('data:tabs')
                    current.push({ id: 'custom_' + self.customs, name: 'Custom ' + self.customs, enabled: false })

                    cs(self, 'tabsModel').value('state:active-tab', current.length - 1)
                    cs(self, 'tabsModel').value('data:tabs', current, true)

                    self.customs++
                }
            })

            cs(self).subscribe({
                name: 'addConstraintset', spool: 'rendered',
                func: function (ev, tab) {
                    var newCustom = cs(this, 'tabsModel/view').create(tab.id, app.ui.widget.constraintset.model)
                    newCustom.state('visible')

                    if (tab.id.indexOf('custom'))
                        self.customs++
                }
            })

            cs(self).register({
                name: 'removeConstraintset', spool: 'rendered',
                func: function () {
                    var tabs = cs(self, 'tabsModel').value('data:tabs')
                    var idx = cs(self, 'tabsModel').value('state:active-tab')
                    var activeTab = tabs[idx]
                    if (activeTab.id === 'standard') {
                        /* global alert: true */
                        alert('You cannot delete the standard constraint set')
                        return;
                    }
                    var tab = cs(self, 'tabsModel/view/' + activeTab.id)
                    cs.destroy(tab)
                    activeTab.deleted = true
                    cs(self, 'tabsModel').value('data:tabs', tabs, true)
                }
            })
        },
        cleanup: function () {
            cs(this).unspool('prepared')
        },
        release: function () {
            cs(this).unspool('rendered')
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
                'data:tabs':         { value: [],   valid: '[{ id: string, name: string, enabled: boolean, socket?: string, deleted?: boolean, content?: string }*]', store: true },
                'state:active-tab':  { value: -1,   valid: 'number', store: true                                                                   },
                'event:tab-checked': { value: null, valid: '(null | { tabIndex: number, state: boolean })', autoreset: true                        },
                'data:savable':      { value: '',   valid: 'string'                                                                                }
            })

            cs(self).observe({
                name: 'data:savable', spool: 'created',
                operation: 'get',
                func: function () {
                    var activeTab = cs(self).value('data:tabs')[cs(self).value('state:active-tab')]
                    var content = cs(self, 'view/' + activeTab.id).value('data:savable')
                    cs(self).value('data:savable', content)
                }
            })

            cs(self).observe({
                name: 'event:tab-checked', spool: 'created',
                func: function (ev, checkEvent) {
                    cs(self).value('data:tabs')[checkEvent.tabIndex].enabled = checkEvent.state
                    cs(self).touch('data:tabs')
                    cs(self).publish('editorChanged')
                }
            })
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

app.ui.widget.vertical.tabs.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this

            /*  plug mask into parent  */
            var details = $.markup('vertical-tabs')
            cs(self).plug(details)

            /*  render tabs  */
            cs(self).observe({
                name: 'data:tabs', spool: 'rendered',
                touch: true,
                func: function (ev, tabs) {
                    var i
                    /*  clean up orphaned tabs */
                    for (i = 0; i < tabs.length; i++) {
                        if (tabs[i].deleted) {
                            $('.vertical-tabs > .vertical-tab', details).eq(i).remove()
                            $('.vertical-contents > .vertical-content', details).eq(i).remove()
                            cs(self).unsocket(tabs[i].socket)
                            tabs.splice(i, 1)
                            for (var x = i; x < tabs.length; x++)
                                $('.vertical-tabs > .vertical-tab', details).eq(x).data('i', x)
                        }
                    }

                    /*  render new tabs  */
                    for (i = 0; i < tabs.length; i++) {
                        if (!tabs[i].socket) {

                            cs(self).publish('addConstraintset', tabs[i])
                           $('.vertical-tabs', details).markup('vertical-tabs/vertical-tab', { i: i, name: tabs[i].name })

                            /*  react on tab click  */
                            $('.vertical-tab', details).eq(i).click(function () {
                                cs(self).value('state:active-tab', $(this).data('i'))
                            })

                            /*  react on checkbox click  */
                            $('.vertical-tab > input[type=checkbox]', details).eq(i).click(function () {
                                cs(self).value('event:tab-checked', { tabIndex: $(this).data('i'), state: $(this).is(':checked')})
                            })

                            var content = $('.vertical-contents', details).markup('vertical-tabs/content')
                            tabs[i].socket = cs(self).socket({ scope: tabs[i].id, ctx: $(content), type: 'jquery' })
                        }

                        /*  set the correct enabled state  */
                        $('.vertical-tab > input[type=checkbox]', details).eq(i).attr('checked', tabs[i].enabled)
                    }

                    /*  enforce active tab  */
                    cs(self).touch('state:active-tab')
                }
            })

            /*  react on active tab change  */
            cs(self).observe({
                name: 'state:active-tab', spool: 'rendered',
                touch: true,
                func: function (ev, active) {
                    var tabs = cs(self).value('data:tabs').length
                    if (active >= tabs)
                        active = tabs - 1
                    if (active === -1) {
                        active = 0
                    }
                    $('.vertical-tab.active', details).removeClass('active')
                    $('.vertical-tab', details).eq(active).addClass('active')
                    $('.vertical-contents .vertical-content.active', details).removeClass('active')
                    $('.vertical-contents .vertical-content', details).eq(active).addClass('active')
                    ev.result(active)
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})
