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
        },
        prepare: function () {
        },
        render: function () {
        },
        release: function () {
        },
        cleanup: function () {
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

            $('#componentTree-content').click(function () { self.addAsChildByName(prompt('Add where?','/'), self.newNode(self.idx++)) })
            //$('#componentTree-content').click(function () { self.removeByName(prompt('Delete which?','Library')) })
        },
        show: function () {
            var self = this

            var treeData = {
                name: "/",
                contents: [
                    {
                        name: "Applications",
                        contents: [
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
                        contents: []
                    },
                    {
                        name: "Library",
                        contents: [
                            {
                                name: "Application Support",
                                contents: [
                                    { name: "Adobe" },
                                    { name: "Apple" },
                                    { name: "Google" },
                                    { name: "Microsoft" }
                                ]
                            },
                            {
                                name: "Languages",
                                contents: [
                                    { name: "Ruby" },
                                    { name: "Python" },
                                    { name: "Javascript" },
                                    { name: "C#" }
                                ]
                            },
                            {
                                name: "Developer",
                                contents: [
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
                        contents: []
                    },
                    {
                        name: "Users",
                        contents: [
                            { name: "pavanpodila" },
                            { name: "admin" },
                            { name: "test-user" }
                        ]
                    }
                ]
            }

            self.newNode = function (idx) {
                return {
                name: "Döner" + idx,
                contents: [
                    { name: 'Chris' + idx },
                    { name: 'Uwe' + idx },
                    { name: 'Adrian' + idx}
                ]
            }}

            self.newNode2 = {
                name: "root"
            }

            var containerName = "#componentTree-content"

            var visit = function (parent, visitFn)
            {
                if (!parent) return
                visitFn(parent)
                if (parent.contents) {
                    var count = parent.contents.length
                    for (var i = 0; i < count; i++) {
                        visit(parent.contents[i], visitFn)
                    }
                }
            }

            var maxLabelLength = 0
            visit(treeData, function (d) {
                maxLabelLength = Math.max(d.name.length, maxLabelLength)
            })

            var options = $.extend({
                nodeRadius: 5, fontSize: 12
            })

            var size = { width: $(containerName).outerWidth(), height: $(containerName).outerHeight() }

            var tree = d3.layout.tree()
                .sort(null)
                .size([ size.width, size.height - maxLabelLength - 20 ])
                .children(function (d)
                {
                    return (!d.contents || d.contents.length === 0) ? null : d.contents
                })

            var layoutRoot = d3.select(containerName)
                .append('svg:svg').attr('width', size.width).attr('height', size.height)
                .append('svg:g')
                .attr('class', 'container')
                .attr('transform', 'translate(0,' + maxLabelLength + ')')

            var update = function (data) {
                var nodes = tree.nodes(treeData)
                var links = tree.links(nodes)
                var margin = 20
                var elbow = function (d) {
                  return 'M' + d.source.x + ',' + (d.source.y + options.nodeRadius) +
                        'V' + (d.source.y + margin) + 'H' + d.target.x +
                        'V' + (d.target.y - options.nodeRadius )
                }

                var exitLinks = layoutRoot.selectAll('path')
                    .data(links, function (d) { return d.source.name + '#' + d.target.name })
                    .exit()
                    //.transition()
                    //.duration(400)
                    .style('opacity', 0)
                    .remove()

                var currentLinks = layoutRoot.selectAll('path')
                    .data(links, function (d) { return d.source.name + '#' + d.target.name })
                    //.transition()
                    //.delay(600)
                    .attr('d', elbow)

                var enterLinks = layoutRoot.selectAll('path.link')
                    .data(links, function (d) { return d.source.name + '#' + d.target.name })
                    .enter()
                    .append('svg:path')
                    //.transition()
                    //.delay(700)
                    .attr('class', 'link')
                    .attr('d', elbow)

                var exitNodes = layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.name })
                    .exit()
                    //.transition()
                    //.duration(400)
                    .style('opacity', 0)
                    .remove()

                var currentNodes = layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.name })
                    //.transition()
                    //.delay(600)
                    .attr("transform", function (d)
                        {
                            return "translate(" + d.x + "," + d.y + ")"
                        })

                layoutRoot.selectAll('g')
                    .select('text')
                    .attr('text-anchor', function (d)
                        {
                            return d.contents ? 'start' : 'end'
                        })
                    .attr('dx', function (d)
                        {
                            var gap = 2 * options.nodeRadius
                            return d.contents ? -gap : gap
                        })
                    .attr('dy', function (d) {
                            return d.contents && d.parent ? -5 : 3
                        })

                var enterNodes = layoutRoot.selectAll('g')
                    .data(nodes, function (d) { return d.name })
                    .enter()
                    .append('svg:g')
                    .attr('class', 'node')
                    .attr('transform', function (d)
                        {
                            return 'translate(' + d.x + ',' + d.y + ')'
                        })

                enterNodes.append('svg:circle')
                    //.transition()
                    //.delay(700)
                    .attr('class', 'node-dot')
                    .attr('r', options.nodeRadius)

                enterNodes.append('svg:text')
                    //.transition()
                    //.delay(700)
                    .attr('text-anchor', function (d)
                        {
                            return d.contents ? 'start' : 'end'
                        })
                    .attr('dx', function (d)
                        {
                            var gap = 2 * options.nodeRadius
                            return d.contents ? gap : -gap
                        })
                    .attr('dy', function (d) {
                            return d.contents && d.parent ? -5 : 3
                        })
                    .text(function(d)
                        {
                            return d.name
                        })
            }

            update(treeData)

            var findInTree = function (tree, name) {
                var acc = []
                if (tree.name === name) {
                    acc.push(tree)
                }
                _.each(tree.contents, function (content) {
                    acc = acc.concat(findInTree(content, name))
                })
                return acc
            }

            var removeFromTree = function (tree, name) {
                //  We want to remove the root node
                if (tree.name === name)
                    return {}
                tree.contents = _.filter(tree.contents, function (content) { return content.name !== name })
                _.each(tree.contents, function (content) { removeFromTree(content, name) })
            }

            self.removeByName = function (name) {
                if (findInTree(treeData, name).length === 0)
                    return
                removeFromTree(treeData, name)
                update(treeData)
            }

            self.addAsChildByName = function (name, newNode) {
                var node = findInTree(treeData, name)[0]
                /*  does the node exist?  */
                if (!node || findInTree(treeData, newNode.name).length !== 0)
                    return
                if (!node.contents)
                    node.contents = [ newNode ]
                else
                    node.contents.push(newNode)
                update(treeData)
            }
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})