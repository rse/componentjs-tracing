/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global clearTimeout: true, setTimeout: true, setInterval: true, prompt: true, escape: true */

app.ui.comp.componentTree = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this
            cs(self).property('ComponentJS:state-auto-increase', false)

            cs(self).create('model/view/toolbar',
                app.ui.comp.componentTree.model,
                app.ui.comp.componentTree.view,
                app.ui.widget.toolbar
            )

            cs(self).register({
                name: 'getComponent', spool: 'created',
                func: function (path) {
                    return self.findInTree(cs(self, 'model').value('data:tree'), path)
                }
            })
        },
        findInTree: function (tree, path) {
            var self = this
            var acc = []
            if (tree.path === path) {
                acc.push(tree)
            }
            _.each(tree.children, function (child) {
                acc = acc.concat(self.findInTree(child, path))
            })
            return acc
        },
        prepare: function () {
            var self = this



            var removeFromTree = function (tree, path) {
                //  We want to remove the root node
                if (tree.path === path)
                    return {}
                tree.children = _.filter(tree.children, function (child) { return child.path !== path })
                _.each(tree.children, function (child) { removeFromTree(child, path) })
            }

            var nameRegex = /\/([^\/]*)$/
            cs(self).subscribe({
                name: 'event:new-trace', spool: 'materialized',
                spreading : true, capturing : false, bubbling : false,
                func: function (ev, trace) {
                    if (!cs(self, 'model').value('state:record'))
                        return
                    var tree = cs(self, 'model').value('data:tree')
                    var node, list
                    var handleListPropertyAdd = function (path, name, property) {
                        node = self.findInTree(tree, path)[0]
                        if (!node)
                            return
                        var list = node[property] || []
                        list.push(name)
                        node[property] = _.uniq(list)
                    }
                    var handleListPropertyRemove = function (path, name, property) {
                        node = self.findInTree(tree, path)[0]
                        if (!node)
                            return
                        list = node.list || []
                        node[property] = _.without(list, name)
                    }
                    if (trace.operation === 'create') {
                        var matches = trace.origin.match(nameRegex)
                        var newNode = { name: matches[1], path: trace.origin, type: trace.originType, state: 'created', children: [], markers: _.keys(trace.parameters.markers), outgoing: [] }
                        var insPt = trace.origin.substring(0, trace.origin.length - matches[0].length)
                        if (insPt.length === 0)
                            insPt = '/'
                        cs(self).call('add', insPt, newNode)
                    }
                    else if (trace.operation === 'state') {
                        node = self.findInTree(tree, trace.origin)[0]
                        if (node) {
                            node.state = trace.parameters.state
                            cs(self, 'model').value('data:tree', tree, true)
                        }
                    }
                    else if (trace.operation === 'register')
                        handleListPropertyAdd(trace.origin, trace.parameters.name, 'services')
                    else if (trace.operation === 'unregister')
                        handleListPropertyRemove(trace.origin, trace.parameters.name, 'services')
                    else if (trace.operation === 'socket')
                        handleListPropertyAdd(trace.origin, trace.parameters.name + '@' + trace.parameters.scope, 'sockets')
                    else if (trace.operation === 'unsocket')
                        handleListPropertyRemove(trace.origin, trace.parameters.name, 'sockets')
                    else if (trace.operation === 'subscribe')
                        handleListPropertyAdd(trace.source, trace.parameters.name, 'subscribtions')
                    else if (trace.operation === 'unsubscribe')
                        handleListPropertyRemove(trace.source, trace.parameters.name, 'subscribtions')
                    else if (trace.operation === 'model') {
                        var model = trace.parameters.model
                        node = self.findInTree(tree, trace.origin)[0]
                        node.model = []
                        _.forIn(model, function (value, key) {
                            node.model.push(key)
                        })
                    }
                    else if (trace.operation === 'destroy')
                        cs(self).call('remove', trace.origin)
                    if (trace.origin !== trace.source) {
                        node = self.findInTree(tree, trace.source)[0]
                        if (node)
                            node.outgoing.push(self.findInTree(tree, trace.origin)[0])
                    }
                }
            })

            cs(self).register({
                name: 'remove', spool: 'materialized',
                func: function (path) {
                    var tree = cs(self, 'model').value('data:tree')
                    if (self.findInTree(tree, path).length === 0)
                        return
                    removeFromTree(tree, path)
                    cs(self, 'model').value('data:tree', tree, true)
                }
            })

            cs(self).register({
                name: 'add', spool: 'materialized',
                func: function (path, newNode) {
                    var tree = cs(self, 'model').value('data:tree')
                    var node = self.findInTree(tree, path)[0]
                    /*  does the node exist?  */
                    if (!node || self.findInTree(tree, newNode.path).length !== 0)
                        return
                    if (!node.children)
                        node.children = [ newNode ]
                    else
                        node.children.push(newNode)
                    cs(self, 'model').value('data:tree', tree, true)
                }
            })

            var toolbarItems = [{
                label: 'Record',
                icon:  'microphone',
                type: 'button',
                id: 'recordBtn',
                click: 'event:record',
                state: 'state:record'
            }, {
                label: 'Clear',
                icon:  'remove-sign',
                type: 'button',
                id: 'clearBtn',
                click: 'event:clear'
            }]

            cs(this, 'model/view/toolbar').call('initialize', toolbarItems)
        }
    }
})

app.ui.comp.componentTree.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(this).model({
                'data:tree'            : { value: null,                             valid: 'object'                   },
                'state:cmd'            : { value: 'cs(\'/ui\').state(\'created\')', valid: 'string',  store: true     },
                'state:tooltip-sticky' : { value: false,                            valid: 'boolean'                  },
                'event:clear'          : { value: false,                            valid: 'boolean', autoreset: true },
                'event:record'         : { value: false,                            valid: 'boolean', autoreset: true },
                'state:record'         : { value: false,                            valid: 'boolean', store: true     }
            })
        },
        root: function () {
            return {
                name: '/',
                path: '/',
                outgoing: [],
                children: []
            }
        },
        prepare: function () {
            cs(this).value('data:tree', this.root())
        },
        show: function () {
            var self = this
            cs(self).observe({
                name: 'event:record', spool: 'visible',
                func: function () {
                    cs(self).value('state:record', !cs(self).value('state:record'))
                }
            })

            cs(self).observe({
                name: 'event:clear', spool: 'visible',
                func: function () {
                    cs(self).value('data:tree', self.root())
                }
            })
        }
    }
})

app.ui.comp.componentTree.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        idx: 0,
        tooltip: null,
        timer: null,
        nodes: [],
        legend: null,
        layoutRoot: null,
        tree: null
    },
    protos: {
        render: function () {
            var self = this
            cs(this).property('ComponentJS:state-auto-increase', true)
            var content = $.markup('componentTree-content')
            $('i', content).addClass('icon-angle-right')

            cs(self).socket({
                scope: 'toolbar',
                ctx: $('.toolbar', content)
            })

            cs(self).plug({
                object: content,
                spool: 'materialized'
            })

            self.tooltip = d3.select('#tree').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0)
            self.legend = d3.select('#tree').append('div')
                .attr('id', 'legend')
                .style('opacity', 1)

            $('#console', content).click(function () {
                var cmd = prompt('Please enter a command', cs(self).value('state:cmd'))
                if (cmd) {
                    cs(self).publish('sendCommand', escape(cmd))
                    cs(self).value('state:cmd', cmd)
                }
            })
        },
        show: function () {
            var self = this

            var containerName = '#tree'
            var options = $.extend({
                nodeRadius: 5, fontSize: 12
            })
            var hideTooltip = function () {
                self.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0)
                    .style('pointer-events', 'none')
                self.layoutRoot.selectAll('.hover-line')
                    .transition()
                    .duration(500)
                    .style('opacity', 0)
                    .remove()
            }

            var setup = function () {
                self.tree = d3.layout.tree()
                    .sort(null)
                    .size([ size.width, size.height - 35 ])

                self.layoutRoot = d3.select(containerName)
                    .append('svg:svg').attr('width', size.width).attr('height', size.height)
                    .append('svg:g')
                    .attr('class', 'container')
                    .attr('transform', 'translate(0,30)')

                $(containerName + ' > svg').click(function () {
                    if (cs(self).value('state:tooltip-sticky')) {
                        cs(self).value('state:tooltip-sticky', false)
                        hideTooltip()
                    }
                })

                /*  legend circle factory method  */
                var drawLegendItems = function (clazz) {
                    d3.select('td.' + clazz)
                        .append('svg:svg').attr('width', 14).attr('height', 14)
                        .append('svg:circle')
                        .attr('class', clazz)
                        .attr('cx', 6)
                        .attr('cy', 6)
                        .attr('r', options.nodeRadius)
                }
                drawLegendItems('view')
                drawLegendItems('controller')
                drawLegendItems('model')
                drawLegendItems('service')
            }

            var handleResize = function () {
                size = { width: $(containerName).outerWidth(), height: $(containerName).outerHeight() }
                $('svg').remove()
                setup()
                update(cs(self).value('data:tree'))
            }

            $(window).resize(function () {
                if (self.timer !== null) {
                    clearTimeout(self.timer)
                }
                self.timer = setTimeout(function () {
                    handleResize()
                }, 300)
            })

            var size = { width: $(containerName).outerWidth(), height: $(containerName).outerHeight() }

            $('#tree > #legend').html($.markup('component-tree-legend'))
            setup()

            var update = function (root) {
                if (!root) {
                    self.layoutRoot.selectAll('g').remove()
                    self.layoutRoot.selectAll('path').remove()
                    return
                }

                self.nodes = self.tree.nodes(root)
                var links = self.tree.links(self.nodes)
                var margin = 20
                var elbow = function (d) {
                  return 'M' + d.source.x + ',' + (-d.source.y + size.height - options.nodeRadius - 40) +
                        'V' + (-d.source.y + size.height - 40 - margin) + 'H' + d.target.x +
                        'V' + (-d.target.y + size.height - 40 - options.nodeRadius )
                }
                var lineFunc = d3.svg.line()
                                        .x(function (d) { return d.x })
                                        .y(function (d) { return d.y })
                                        .interpolate('basis')

                /*  remove the exiting nodes  */
                self.layoutRoot.selectAll('g')
                    .data(self.nodes, function (d) { return d.path })
                    .exit()
                    //.transition()
                    //.duration(400)
                    .style('opacity', 0)
                    .remove()

                /*  remove the exiting links  */
                self.layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.path + '#' + d.target.path })
                    .exit()
                    //.transition()
                    //.duration(400)
                    .style('opacity', 0)
                    .remove()

                /*  refresh the remaining links  */
                self.layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.path + '#' + d.target.path })
                    //.transition()
                    //.delay(600)
                    .attr('d', elbow)

                /*  display the new links  */
                self.layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.path + '#' + d.target.path })
                    .enter()
                    .append('svg:path')
                    //.transition()
                    //.delay(700)
                    .attr('class', 'link')
                    .attr('d', elbow)

                /*  refresh the remaining nodes positions  */
                self.layoutRoot.selectAll('g')
                    .data(self.nodes, function (d) { return d.path })
                    //.transition()
                    //.delay(600)
                    .attr('transform', function (d) {
                        return 'translate(' + d.x + ',' + (-d.y + size.height - 40) + ')'
                    })

                /* refresh the remaining nodes names  */
                self.layoutRoot.selectAll('g')
                    .select('text')
                    //.transition()
                    //.delay(700)
                    .text(function (d) {
                        return d.name
                    })

                /*  create groups for the new nodes  */
                var enterNodes = self.layoutRoot.selectAll('g')
                    .data(self.nodes, function (d) { return d.path })
                    .enter()
                    .append('svg:g')
                    .attr('class', 'node')
                    .attr('transform', function (d) {
                        return 'translate(' + d.x + ',' + (-d.y + size.height - 40) + ')'
                    })

                /*  add circles and tooltip listeners to the new nodes  */
                enterNodes.append('svg:circle')
                    .on('mouseover', function (d) {
                        if (d.path === '/')
                            self.tooltip.html(d.path)
                        else
                            $('#tree > .tooltip').html($.markup('component-tree-tooltip',{
                                name: d.name,
                                path: d.path,
                                type: d.type,
                                state: d.state,
                                model: (d.model ? d.model.join(', ') : undefined),
                                services: (d.services ? d.services.join(', ') : undefined),
                                subscribtions: (d.subscribtions ? d.subscribtions.join(', ') : undefined),
                                markers: (d.markers ? d.markers.join(', ') : undefined),
                                sockets: (d.sockets ? d.sockets.join(', ') : undefined)
                            }))
                        var tooltipWidth = $(self.tooltip[0]).outerWidth()
                        var tooltipHeight = $(self.tooltip[0]).outerHeight()
                        self.tooltip.transition()
                            .duration(200)
                            .style('opacity', 0.9)
                            .style('pointer-events', 'all')
                        var x = d.x + tooltipWidth + 10 < size.width ? d.x + 7 : d.x - tooltipWidth - 7
                        var y = d.y - tooltipHeight - 10 > 0 ? d.y - 10 : d.y + tooltipHeight - 50

                        self.tooltip
                            .style('left', x + 'px')
                            .style('top', -y + size.height + 5 + 'px')
                        self.layoutRoot.selectAll('.hover-line').remove()
                        _.each(d.outgoing, function (out) {
                            var isLeft = function () { return d.x > out.x }
                            var isRight = function () { return d.x < out.x }
                            var isAbove = function () { return d.y < out.y }
                            var isBelow = function () { return d.y > out.y }
                            var hEqual = function () { return d.y === out.y }
                            var vEqual = function () { return d.x === out.x }

                            /*  set the supporting point to the middle of delta x and delta y => linear curve  */
                            var xSupp = (d.x + out.x) / 2
                            var ySupp = -((d.y + out.y) / 2) + size.height - 40

                            if (isAbove() && !vEqual() || hEqual())
                                ySupp += 25
                            else if (isBelow() && !vEqual())
                                ySupp -= 25
                            if (isLeft() && !hEqual() || vEqual())
                                xSupp -= 25
                            else if (isRight() && !hEqual())
                                xSupp += 25

                            var xStart = d.x
                            var yStart = (-d.y + size.height - 40)
                            var xEnd = out.x
                            var yEnd = (-out.y + size.height - 40)
                            var offset = options.nodeRadius / 2 + 1

                            if (isLeft())
                                xEnd += offset
                            if (isLeft() || vEqual())
                                xStart -= (offset + 1)
                            if (isAbove() || hEqual())
                                yStart -= offset
                            if (isRight())
                                xStart += (offset + 1)
                            else if (isRight() || vEqual())
                                xEnd -= offset
                            if (isAbove() && isRight())
                                yEnd += (offset + 1)
                            else if (isAbove())
                                yEnd += offset
                            else if (isBelow() || hEqual)
                                yEnd -= offset

                            var lineData = [ { x: xStart, y: yStart },
                                             { x: xSupp, y: ySupp },
                                             { x: xEnd, y: yEnd } ]
                            self.layoutRoot.append('path')
                                            .attr('d', lineFunc(lineData))
                                            .attr('class', 'hover-line')
                                            .transition()
                                            .duration(200)
                                            .style('opacity', 1)
                        })
                    })
                    .on('mouseout', function () {
                        if (!cs(self).value('state:tooltip-sticky'))
                            hideTooltip()
                    })
                    .on('click', function () {
                        d3.event.stopImmediatePropagation()
                        cs(self).value('state:tooltip-sticky', !cs(self).value('state:tooltip-sticky'))
                    }, true)
                    //.transition()
                    //.delay(700)
                    .attr('class', function (d) {
                        if (!d.type)
                            return 'default'
                        else if (d.type === 'V')
                            return 'view'
                        else if (d.type === 'M')
                            return 'model'
                        else if (d.type === 'S')
                            return 'service'
                        return 'default'
                    })
                    .attr('r', options.nodeRadius)

                /*  add text to the new nodes  */
                enterNodes.append('svg:text')
                    //.transition()
                    //.delay(700)
                    .attr('text-anchor','start')
                    .attr('dx',2 * options.nodeRadius)
                    .attr('dy', -5)
                    .text(function (d) {
                        return d.name
                    })
            }

            cs(self).observe({
                name: 'data:tree', spool: 'visible',
                touch: true,
                func: function (ev, tree) {
                    update(tree)
                }
            })

            var cursorAnimation = function () {
                $('#cursor').animate({
                    opacity: 0
                }, 'fast', 'swing').animate({
                    opacity: 1
                }, 'fast', 'swing');
            }

            setInterval(cursorAnimation, 300)
        },
        hide: function () {
            $('svg').remove()
        }
    }
})