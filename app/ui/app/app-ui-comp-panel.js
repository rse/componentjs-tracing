/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.comp.panel = cs.clazz({
    mixin: [ cs.marker.controller ],
    dynamics: {
        constraintSet: [],
        temporalConstraintSet: [],
        temporalMonitors: []
    },
    protos: {
        create: function () {
            var self = this

            cs(self).create(
                'panel/panel/' +
                '{tracing,checking,constraints,temporalConstraints,statusbar}',
                app.ui.widget.panel.model,
                app.ui.widget.panel.view,
                app.ui.comp.tracing,
                app.ui.comp.checking,
                new app.ui.comp.constraints('cjscp'),
                new app.ui.comp.constraints('cjsct'),
                app.ui.widget.statusbar
            )

            cs(self).create('headline', app.ui.widget.headline.view)

            cs(self).property('ComponentJS:state-auto-increase', true)

            cs(self).subscribe({
                name: 'constraintSetChanged', spool: 'created',
                func: function (ev, nVal) {
                    self.constraintSet = nVal
                }
            })

            cs(self).subscribe({
                name: 'temporalConstraintSetChanged', spool: 'created',
                func: function (ev, nVal) {
                    self.temporalConstraintSet = nVal
                    self.temporalMonitors = []
                    _.map(nVal, function (temporalSet) {
                        _.map(temporalSet, function (temporal) {
                            self.temporalMonitors.push(new app.lib.happens_before_monitor(temporal))
                        })
                    })
                }
            })

            cs(self).subscribe({
                name: 'checkJournal', spool: 'created',
                func: function () {
                    var traces = cs(self, 'panel/panel/tracing').call('traces')
                    var resTraces = cs('/sv').call('checkTraces', traces, self.constraintSet)

                    cs(self, 'panel/panel/checking').call('displayTraces', resTraces)
                }
            })

            cs(self).subscribe({
                name: 'checkTrace', spool: 'created',
                func: function (ev, trace) {
                    trace = app.lib.richTrace.enrich(trace)
                    var resTraces = cs('/sv').call('checkTraces', [ trace ], self.constraintSet)
                    _.map(self.temporalMonitors, function (monitor) {
                        var res = monitor.processTrace(trace)
                        if (res)
                            resTraces.push(res)
                    })
                    if (resTraces.length === 0)
                        return
                    cs(self, 'panel/panel/checking').call('unshift', resTraces[0])
                }
            })

            /*  handle the websocket state and push it to the statusbar  */
            cs(self, 'panel/panel/statusbar').publish('message', 'Connecting ...')
            cs(self, 'panel/panel/statusbar').publish('color', 'yellow')

            /* global io: true */
            var socket = io.connect()
            socket.on('connect', function () {
                socket.emit('join')
                cs(self, 'panel/panel/statusbar').publish('message', 'Connected')
                cs(self, 'panel/panel/statusbar').publish('color', 'black')
            })
            socket.on('reconnect', function () {
                cs(self, 'panel/panel/statusbar').publish('message', 'Reconnected')
                cs(self, 'panel/panel/statusbar').publish('color', 'black')
            })
            socket.on('disconnect', function () {
                cs(self, 'panel/panel/statusbar').publish('message', 'Trying to reconnect ...')
                cs(self, 'panel/panel/statusbar').publish('color', 'red')
            })

            socket.on('newTrace', function (data) {
                cs(self, 'panel/panel/tracing').publish('event:new-trace', data)
            })
        },
        prepare: function () {
            cs(this, 'panel').value('data:tabs', [
                { id: 'tracing',             name: 'Tracing',     icon: "gears"       },
                { id: 'checking',            name: 'Checking',    icon: "thumbs-down" },
                { id: 'constraints',         name: 'Peephole Constraints', icon: "screenshot"  },
                { id: 'temporalConstraints', name: 'Temporal Constraints', icon: "time"        }
            ])
        },
        render: function () {

            var ui = $('body').markup('comp-panel')
            cs(this).socket({ spool: 'materialized', ctx: ui, type: 'jquery' })
            cs(this).spool('materialized', this, function () { $(ui).remove() })

            var headline = $('.headline', ui)
            cs(this).socket({ scope: 'headline', spool: 'materialized', ctx: headline, type: 'jquery' })
            cs(this).spool('materialized', this, function () { $(headline).remove() })
        },
        release: function () {
            cs(this).unspool('materialized')
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})
