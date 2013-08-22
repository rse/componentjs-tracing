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
            cs(this).property('ComponentJS:state-auto-increase', false)

            cs(this).create('{model/view}',
                app.ui.comp.componentTree.model,
                app.ui.comp.componentTree.view
            )
        },
        prepare: function () {
            var self = this

            var findInTree = function (tree, path) {
                var acc = []
                if (tree.path === path) {
                    acc.push(tree)
                }
                _.each(tree.children, function (child) {
                    acc = acc.concat(findInTree(child, path))
                })
                return acc
            }

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
                    var tree = cs(self, 'model').value('data:tree')
                    var node, list
                    var handleListPropertyAdd = function (path, name, property) {
                        node = findInTree(tree, path)[0]
                        var list = node[property] || []
                        list.push(name)
                        node[property] = _.uniq(list)
                    }
                    var handleListPropertyRemove = function (path, name, property) {
                        node = findInTree(tree, path)[0]
                        list = node.list || []
                        node[property] = _.without(list, name)
                    }
                    if (trace.operation === 'create') {
                        var matches = trace.origin.match(nameRegex)
                        var newNode = { name: matches[1], path: trace.origin, type: trace.originType, state: 'created', children: [], markers: _.keys(trace.parameters.markers) }
                        var insPt = trace.origin.substring(0, trace.origin.length - matches[0].length)
                        if (insPt.length === 0)
                            insPt = '/'
                        cs(self).call('add', insPt, newNode)
                    }
                    else if (trace.operation === 'state') {
                        node = findInTree(tree, trace.origin)[0]
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
                        node = findInTree(tree, trace.origin)[0]
                        node.model = []
                        _.forIn(model, function (value, key) {
                            node.model.push(key)
                        })
                    }
                    else if (trace.operation === 'destroy')
                        cs(self).call('remove', trace.origin)
                }
            })

            cs(self).register({
                name: 'remove', spool: 'materialized',
                func: function (path) {
                    var tree = cs(self, 'model').value('data:tree')
                    if (findInTree(tree, path).length === 0)
                        return
                    removeFromTree(tree, path)
                    cs(self, 'model').value('data:tree', tree, true)
                }
            })

            cs(self).register({
                name: 'add', spool: 'materialized',
                func: function (path, newNode) {
                    var tree = cs(self, 'model').value('data:tree')
                    var node = findInTree(tree, path)[0]
                    /*  does the node exist?  */
                    if (!node || findInTree(tree, newNode.path).length !== 0)
                        return
                    if (!node.children)
                        node.children = [ newNode ]
                    else
                        node.children.push(newNode)
                    cs(self, 'model').value('data:tree', tree, true)
                }
            })
        }
    }
})

app.ui.comp.componentTree.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(this).model({
                'data:tree':             { value: null,                             valid: 'object'              },
                'state:cmd':             { value: 'cs(\'/ui\').state(\'created\')', valid: 'string', store: true },
                'state:tooltip-sticky' : { value: false, valid: 'boolean'                                        }
            })
        },
        prepare: function () {
            var root = {
                name: '/',
                path: '/',
                children: []
            }
            cs(this).value('data:tree', root)
        }
    }
})

app.ui.comp.componentTree.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        idx: 0,
        tooltip: null,
        timer: null,
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

            cs(self).plug({
                object: content,
                spool: 'rendered'
            })

            self.tooltip = d3.select('#componentTree-content').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0)
            self.legend = d3.select('#componentTree-content').append('div')
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

            var containerName = '#componentTree-content'
            var options = $.extend({
                nodeRadius: 5, fontSize: 12
            })
            var hideTooltip = function () {
                self.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0)
                    .style('pointer-events', 'none')
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

            $('#componentTree-content > #legend').html($.markup('component-tree-legend'))
            setup()

            var update = function (root) {
                if (!root) {
                    self.layoutRoot.selectAll('g').remove()
                    self.layoutRoot.selectAll('path').remove()
                    return
                }

                var nodes = self.tree.nodes(root)
                var links = self.tree.links(nodes)
                var margin = 20
                var elbow = function (d) {
                  return 'M' + d.source.x + ',' + (-d.source.y + size.height - options.nodeRadius - 40) +
                        'V' + (-d.source.y + size.height - 40 - margin) + 'H' + d.target.x +
                        'V' + (-d.target.y + size.height - 40 - options.nodeRadius )
                }

                /*  remove the exiting nodes  */
                self.layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.path })
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
                    .data(nodes, function (d) { return d.path })
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
                    .data(nodes, function (d) { return d.path })
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
                            $('#componentTree-content > .tooltip').html($.markup('component-tree-tooltip',{
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
                name: 'data:tree', spool: 'shown',
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
            cs(this).unspool('shown')
            $('svg').remove()
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})