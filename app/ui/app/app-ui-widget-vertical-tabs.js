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
        timer: null
    },
    protos: {
        create: function () {
            var self = this
            cs(self).create('model/view',
                app.ui.widget.vertical.tabs.model,
                app.ui.widget.vertical.tabs.view
            )

            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (cfg) {
                    cs(self, 'model').value('data:tabs', cfg.tabs)
                    cs(self, 'model').value('state:domain', cfg.domain)
                }
            })

            cs(self).register({
                name: 'addConstraintset', spool: 'created',
                func: function (newTab) {
                    var current = cs(self, 'model').value('data:tabs')
                    current.push(newTab)

                    cs(self, 'model').value('state:active-tab', current.length - 1)
                    cs(self, 'model').value('data:tabs', current, true)
                }
            })

            cs(self).subscribe({
                name: 'editorChanged', spool: 'created',
                func: function (/* ev */) {
                    if (self.timer !== null) {
                        /* global clearTimeout: true */
                        clearTimeout(self.timer)
                    }
                    /* global setTimeout: true */
                    self.timer = setTimeout(function () {
                        console.log('editorChanged')
                        cs(self).call('parseConstraintsets')
                    }, 1000)
                }
            })

            cs(self).register({
                name: 'parseConstraintsets', spool: 'created',
                func: function () {
                    var tabs = cs(self, 'model').value('data:tabs')
                    var constraintsets = []
                    var domain = cs(self, 'model').value('state:domain')
                    var syntacticallyCorrect = true

                    _.map(tabs, function (tabData) {
                        var tab = cs(self, 'model/view/' + tabData.id)
                        var content = tab.call('getSavable')
                        var result
                        if (domain === 'cjscp')
                            result = cs('/sv').call('parseConstraintset', content)
                        else if (domain === 'cjsct')
                            result = cs('/sv').call('parseTemporalConstraintset', content)

                        if (result.success) {
                            tab.call('displaySyntacticError', [])

                            /*  check for semantic correctness in temporal constraints  */
                            var errors
                            if (domain === 'cjscp')
                                errors = cs('/sv').call('validatePeepholeConstraints', result.constraints)
                            else if (domain === 'cjsct')
                                errors = cs('/sv').call('validateTemporalConstraints', result.constraints)

                            if (errors.length !== 0)
                                tab.call('displaySemanticError', errors)
                            else
                                if (tabData.enabled) {
                                    constraintsets.push(result.constraints)
                                    cs(self).publish('setChanged', constraintsets)
                                }
                        }
                        else {
                            result.error.expected = _.filter(result.error.expected, function (exp) { return exp !== '[ \\t\\r\\n]' })
                            result.error.type = 'error'
                            result.error.message = 'Expected ' + result.error.expected.join(' or ') + ' but "' + result.error.found + '" found.'
                            tab.call('displaySyntacticError', [ result.error ])
                            syntacticallyCorrect = false
                        }
                    })
                }
            })
        },
        prepare: function () {
            var self = this

/*            var tabs = cs(self, 'model').value('data:tabs')
            if (tabs.length === 0)
                tabs = [{ id: 'standard', name: 'Standard', enabled: true }]
            else {
                for (var i = 0; i < tabs.length; i++)
                    delete tabs[i].socket
            }
            cs(self, 'model').value('data:tabs', tabs)*/

            cs(self, 'model').observe({
                name: 'data:tabs', spool: '..:prepared',
                touch: true,
                func: function (ev, tabs) {
                    // TODO - destroy children that have been removed
                    _.each(tabs, function (tab) {
                        if (cs(self, 'model/view/' + tab.id).exists())
                            return
                        var newTab = cs(self, 'model/view').create(tab.id, app.ui.widget.constraintset)
                        /*  load content from configured data source  */
                        if (tab.data)
                            $.get(tab.data, function (data) {
                                newTab.call('setContent', data)
                            })
                    })
                }
            })

            cs(self).register({
                name: 'removeConstraintset', spool: 'prepared',
                func: function () {
                    var tabs = cs(self, 'model').value('data:tabs')
                    var idx = cs(self, 'model').value('state:active-tab')
                    var activeTab = tabs[idx]
                    if (activeTab.id === 'standard') {
                        /* global alert: true */
                        alert('You cannot delete the standard constraint set')
                        return;
                    }
                    var tab = cs(self, 'model/view/' + activeTab.id)
                    tab.value('data:constraintset', '')
                    cs.destroy(tab)
                    activeTab.deleted = true
                    cs(self, 'model').value('data:tabs', tabs, true)
                }
            })
        },
        show: function () {
            var self = this

            cs(self).register({
                name: 'saveCurrent', spool: 'visible',
                func: function () {
                    var content = cs(self, 'model').value('data:savable')
                    /* global btoa: true */
                    window.location = 'data:application/octet-stream;base64,' + btoa(content)
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
                'data:tabs'         : { value: [],   valid: '[{ id: string, name: string, enabled: boolean, socket?: string, deleted?: boolean, content?: string, data?: string }*]', store: true },
                'state:active-tab'  : { value: -1,   valid: 'number', store: true                                                                   },
                'event:tab-checked' : { value: null, valid: '(null | { tabIndex: number, state: boolean })', autoreset: true                        },
                'data:savable'      : { value: '',   valid: 'string'                                                                                  },
                'state:domain'      : { value: '',   valid: 'string' }
            })

            cs(self).observe({
                name: 'data:savable', spool: 'created',
                operation: 'get',
                func: function (ev) {
                    /*  retrieve content of the tab that's currently active  */
                    var activeTab = cs(self).value('data:tabs')[cs(self).value('state:active-tab')]
                    var content = cs(self, 'view/' + activeTab.id).call('getSavable')
                    ev.result = content
                }
            })

            cs(self).observe({
                name: 'event:tab-checked', spool: 'created',
                func: function (ev, checkEvent) {
                    var tabs = cs(self).value('data:tabs')
                    tabs[checkEvent.tabIndex].enabled = checkEvent.state
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

                            //cs(self).publish('addConstraintset', tabs[i])
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
                name: 'state:active-tab', spool: 'materialized',
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
        }
    }
})