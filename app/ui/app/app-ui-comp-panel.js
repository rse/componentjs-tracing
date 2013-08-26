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
        peepholeConstraintSet: [],
        temporalConstraints: [],
        temporalMonitors: []
    },
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', true)
            cs(self).create(
                'panel/panel/' +
                '{tracing,checking,peepholeConstraints,temporalConstraints,componentTree,statistics,statusbar,headline}',
                app.ui.widget.panel.model,
                app.ui.widget.panel.view,
                app.ui.comp.tracing,
                app.ui.comp.checking,
                app.ui.comp.constraints.peephole,
                app.ui.comp.constraints.temporal,
                app.ui.comp.componentTree,
                app.ui.comp.statistics,
                app.ui.widget.statusbar,
                app.ui.widget.headline.view
            )

            /*  this may cause constraints to be overwritten, since no
            **  disjunct naming among different constraint sets is enforced
            */
            var computeHierarchy = function (constraintSets) {
                var flat = _.flatten(constraintSets)
                var actual = {}
                var result = []
                _.each(flat, function (constraint) { actual[constraint.id] = constraint })
                _.forIn(actual, function (value) {
                    result.push(value)
                })
                return result
            }

            cs(self).subscribe({
                name: 'peepholeConstraintSetChanged', spool: 'created',
                func: function (ev, nVal) {
                    nVal = computeHierarchy(nVal)
                    self.peepholeConstraintSet = app.lib.sorter(nVal)
                }
            })

            cs(self).subscribe({
                name: 'temporalConstraintSetChanged', spool: 'created',
                func: function (ev, constraints) {
                    self.temporalConstraints = constraints
                    self.temporalMonitors = []
                    _.each(self.temporalConstraints, function (temporal) {
                        self.temporalMonitors.push(new app.lib.happens_before_monitor(temporal))
                    })
                }
            })

            cs(self).subscribe({
                name: 'checkJournal', spool: 'created',
                func: function (ev, traces) {
                    _.each(traces, function (trace) {
                        cs(self).publish('checkTrace', trace)
                    })
                }
            })

            cs(self).subscribe({
                name: 'checkTrace', spool: 'created',
                func: function (ev, trace) {
                    var resTraces = cs('/sv').call('checkTraces', [ trace ], self.peepholeConstraintSet)
                    _.each(self.temporalMonitors, function (monitor) {
                        var res = monitor.processTrace(trace)
                        if (res)
                            resTraces.push(res)
                    })
                    if (resTraces.length === 0)
                        return
                    cs(self, 'panel/panel/checking').call('unshift', resTraces[0])
                }
            })

            cs(self).subscribe({
                name: 'event:status-message', spool: 'created',
                func: function (ev, status) {
                    cs(self, 'panel/panel/statusbar').publish('status', status)
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

            cs(self).subscribe({
                name: 'sendCommand', spool: 'created',
                func: function (ev, cmd) {
                    socket.emit('cmd', cmd)
                }
            })

            socket.on('newTrace', function (trace) {
                trace = app.lib.richTrace.enrich(trace)
                cs(self, 'panel/panel').publish({ name : 'event:new-trace', args : [ trace ], capturing : false, bubbling : false, spreading : true })
            })

            cs(self).subscribe({
                name: 'sendTerminate', spool: 'created',
                func: function () {
                    var result = []
                    var terminate = {id: -1, operation: 'terminate', origin: '/', originType: 'na', parameters: {}, source: '/', sourceType: 'na', time: -1}
                    terminate = app.lib.richTrace.enrich(terminate)
                    _.each(self.temporalMonitors, function (monitor) {
                        result = result.concat(monitor.processTerminate(terminate))
                    })
                    if (result.length === 0)
                        return
                    _.each(result, function (item) {
                        cs(self, 'panel/panel/checking').call('unshift', item)
                    })
                }
            })
        },
        prepare: function () {
            cs(this, 'panel').value('data:tabs', [
                { id: 'tracing',             name: 'Tracing',              icon: 'gears'                                  },
                { id: 'checking',            name: 'Checking',             icon: 'thumbs-down'                            },
                { id: 'peepholeConstraints', name: 'Peephole Constraints', icon: 'screenshot'                             },
                { id: 'temporalConstraints', name: 'Temporal Constraints', icon: 'time'                                   },
                { id: 'componentTree',       name: 'Component Tree',       icon: 'sitemap',    classes: 'icon-rotate-180' },
                { id: 'statistics',          name: 'Statistics',           icon: 'bar-chart'                              }
            ])
        },
        render: function () {
            var ui = $('body').markup('comp-panel')
            cs(this).socket({ spool: 'materialized', ctx: ui, type: 'jquery' })
            cs(this).spool('materialized', this, function () { $(ui).remove() })

            var headline = $('.headline', ui)
            cs(this).socket({ scope: 'headline', spool: 'materialized', ctx: headline, type: 'jquery' })
            cs(this).spool('materialized', this, function () { $(headline).remove() })
        }
    }
})