/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global Handlebars: true */

app.ui.comp.componentTree = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            cs(this).property('ComponentJS:state-auto-increase', true)

            cs(this).create('{model/view}',
                app.ui.comp.componentTree.model,
                app.ui.comp.componentTree.view
            )
        }
    }
})

app.ui.comp.componentTree.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).model({
                'data:tree': { value: null, valid: 'object' }
            })
        },
        prepare: function () {
            var testdata = {
                name: "/",
                children: [
                    {
                        name: "Applications",
                        children: [
                            { name: "Mail.app" },
                            { name: "iPhoto.app" },
                            { name: "Keynote.app" },
                            { name: "iTunes.app" },
                            { name: "XCode.app" },
                            { name: "Numbers.app" },
                            { name: "Pages.app" }
                        ]
                    },
                    {
                        name: "System",
                        children: []
                    },
                    {
                        name: "Library",
                        children: [
                            {
                                name: "Application Support",
                                children: [
                                    { name: "Adobe" },
                                    { name: "Apple" },
                                    { name: "Google" },
                                    { name: "Microsoft" }
                                ]
                            },
                            {
                                name: "Languages",
                                children: [
                                    { name: "Ruby" },
                                    { name: "Python" },
                                    { name: "Javascript" },
                                    { name: "C#" }
                                ]
                            },
                            {
                                name: "Developer",
                                children: [
                                    { name: "4.2" },
                                    { name: "4.3" },
                                    { name: "5.0" },
                                    { name: "Documentation" }
                                ]
                            }
                        ]
                    },
                    {
                        name: "opt",
                        children: []
                    },
                    {
                        name: "Users",
                        children: [
                            { name: "pavanpodila" },
                            { name: "admin" },
                            { name: "test-user" }
                        ]
                    }
                ]
            }
            cs(this).value('data:tree', testdata)
        },
        render: function () {
            var self = this
            var findInTree = function (tree, name) {
                var acc = []
                if (tree.name === name) {
                    acc.push(tree)
                }
                _.each(tree.children, function (child) {
                    acc = acc.concat(findInTree(child, name))
                })
                return acc
            }

            var removeFromTree = function (tree, name) {
                //  We want to remove the root node
                if (tree.name === name)
                    return {}
                tree.children = _.filter(tree.children, function (child) { return child.name !== name })
                _.each(tree.children, function (child) { removeFromTree(child, name) })
            }

            cs(self).register({
                name: 'remove', spool: 'rendered',
                func: function (name) {
                    var tree = cs(self).value('data:tree')
                    if (findInTree(tree, name).length === 0)
                        return
                    removeFromTree(tree, name)
                    cs(this).value('data:tree', tree, true)
                }
            })

            cs(self).register({
                name: 'add', spool: 'rendered',
                func: function (name, newNode) {
                    var tree = cs(self).value('data:tree')
                    var node = findInTree(tree, name)[0]
                    /*  does the node exist?  */
                    if (!node || findInTree(tree, newNode.name).length !== 0)
                        return
                    if (!node.children)
                        node.children = [ newNode ]
                    else
                        node.children.push(newNode)
                    cs(this).value('data:tree', tree, true)
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})

app.ui.comp.componentTree.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        idx: 0
    },
    protos: {
        render: function () {
            var self = this
            var content = $.markup("componentTree-content")

            cs(self).plug({
                object: content,
                spool: 'rendered'
            })

            //$('#componentTree-content').click(function () { self.addAsChildByName(prompt('Add where?','/'), self.newNode(self.idx++)) })
            $('#componentTree-content').click(function () {
                cs(self).call('remove', prompt('Delete which?','Library'))
            })
        },
        show: function () {
            var self = this

            self.newNode = function (idx) {
                return {
                name: "Döner" + idx,
                children: [
                    { name: 'Chris' + idx },
                    { name: 'Uwe' + idx },
                    { name: 'Adrian' + idx}
                ]
            }}

            self.newNode2 = {
                name: "root"
            }

            var containerName = "#componentTree-content"

            var options = $.extend({
                nodeRadius: 5, fontSize: 12
            })

            var size = { width: $(containerName).outerWidth(), height: $(containerName).outerHeight() }

            var tree = d3.layout.tree()
                .sort(null)
                .size([ size.width, size.height - 35 ])

            var layoutRoot = d3.select(containerName)
                .append('svg:svg').attr('width', size.width).attr('height', size.height)
                .append('svg:g')
                .attr('class', 'container')
                .attr('transform', 'translate(0,30)')

            var update = function (root) {
                if (!root) {
                    layoutRoot.selectAll('g').remove()
                    layoutRoot.selectAll('path').remove()
                    return
                }

                var nodes = tree.nodes(root)
                var links = tree.links(nodes)
                var margin = 20
                var elbow = function (d) {
                  return 'M' + d.source.x + ',' + (-d.source.y + size.height - options.nodeRadius - 40) +
                        'V' + (-d.source.y + size.height - 40 - margin) + 'H' + d.target.x +
                        'V' + (-d.target.y + size.height - 40 - options.nodeRadius )
                }

                var exitNodes = layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.name })
                    .exit()
                    .transition()
                    .duration(400)
                    .style('opacity', 0)
                    .remove()

                var exitLinks = layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.name + '#' + d.target.name })
                    .exit()
                    .transition()
                    .duration(400)
                    .style('opacity', 0)
                    .remove()

                var currentLinks = layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.name + '#' + d.target.name })
                    .transition()
                    .delay(600)
                    .attr('d', elbow)

                var enterLinks = layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.name + '#' + d.target.name })
                    .enter()
                    .append('svg:path')
                    .transition()
                    .delay(700)
                    .attr('class', 'link')
                    .attr('d', elbow)

                var currentNodes = layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.name })
                    .transition()
                    .delay(600)
                    .attr("transform", function (d)
                        {
                            return "translate(" + d.x + "," + (-d.y + size.height - 40) + ")"
                        })

                layoutRoot.selectAll('g')
                    .select('text')
                    .transition()
                    .delay(700)
                    .attr('text-anchor', function (d)
                        {
                            return d.children && d.children.length > 0 ? 'start' : 'end'
                        })
                    .attr('dx', function (d)
                        {
                            var gap = 2 * options.nodeRadius
                            return d.children && d.children.length > 0 ? gap : -gap
                        })
                    .attr('dy', function (d) {
                            return d.children && d.children.length > 0 && d.parent ? -5 : 3
                        })
                    .text(function(d)
                        {
                            return d.name
                        })

                var enterNodes = layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.name })
                    .enter()
                    .append('svg:g')
                    .attr('class', 'node')
                    .attr('transform', function (d)
                        {
                            return 'translate(' + d.x + ',' + (-d.y + size.height - 40) + ')'
                        })

                enterNodes.append('svg:circle')
                    .transition()
                    .delay(700)
                    .attr('class', 'node-dot')
                    .attr('r', options.nodeRadius)

                enterNodes.append('svg:text')
                    .transition()
                    .delay(700)
                    .attr('text-anchor', function (d)
                        {
                            return d.children && d.children.length > 0 ? 'start' : 'end'
                        })
                    .attr('dx', function (d)
                        {
                            var gap = 2 * options.nodeRadius
                            return d.children && d.children.length > 0 ? gap : -gap
                        })
                    .attr('dy', function (d) {
                            return d.children && d.children.length > 0 && d.parent ? -5 : 3
                        })
                    .text(function(d)
                        {
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