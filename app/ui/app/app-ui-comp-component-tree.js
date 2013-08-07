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
            cs(this).create('{model/view}',
                app.ui.comp.componentTree.model,
                app.ui.comp.componentTree.view
            )
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

app.ui.comp.componentTree.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
        },
        prepare: function () {
            var self = this
        },
        render: function () {
            var self = this
        },
        release: function () {
        },
        cleanup: function () {
        }
    }
})

app.ui.comp.componentTree.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        create: function () {
        },
        prepare: function () {
        },
        render: function () {
            var content = $.markup("componentTree-content")

            cs(this).plug(content)

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
            };

            var newNode = {
                name: "Döner",
                contents: [
                    { name: 'Chris' },
                    { name: 'Uwe' },
                    { name: 'Adrian'}
                ]
            };

            var containerName = "#componentTree-content"

            var visit = function (parent, visitFn, childrenFn)
            {
                if (!parent) return;

                visitFn(parent);

                var children = childrenFn(parent);
                if (children) {
                    var count = children.length;
                    for (var i = 0; i < count; i++) {
                        visit(children[i], visitFn, childrenFn);
                    }
                }
            }

            var totalNodes = 0;
            var maxLabelLength = 0;
            visit(treeData, function(d)
            {
                totalNodes++;
                maxLabelLength = Math.max(d.name.length, maxLabelLength);
            }, function(d)
            {
                return d.contents && d.contents.length > 0 ? d.contents : null;
            });

            var options = $.extend({
                    nodeRadius: 5, fontSize: 12
                });

            var size = { width:$(containerName).outerWidth(), height: $(containerName).outerHeight() }

            var tree = d3.layout.tree()
                .sort(null)
                .size([size.height, size.width - maxLabelLength * options.fontSize])
                .children(function(d)
                {
                    return (!d.contents || d.contents.length === 0) ? null : d.contents;
                });

            var nodes = tree.nodes(treeData);
            var links = tree.links(nodes);

            var layoutRoot = d3.select(containerName)
                .append("svg:svg").attr("width", size.width).attr("height", size.height)
                .append("svg:g")
                .attr("class", "container")
                .attr("transform", "translate(" + maxLabelLength + ",0)");

            var link = d3.svg.diagonal()
                .projection(function(d)
                {
                    return [d.y, d.x];
                });

            layoutRoot.selectAll("path.link")
                .data(links)
                .enter()
                .append("svg:path")
                .attr("class", "link")
                .attr("d", link);

            var nodeGroup = layoutRoot.selectAll("g.node")
                .data(nodes)
                .enter()
                .append("svg:g")
                .attr("class", "node")
                .attr("transform", function(d)
                {
                    return "translate(" + d.y + "," + d.x + ")";
                });

            nodeGroup.append("svg:circle")
                .attr("class", "node-dot")
                .attr("r", options.nodeRadius);

            nodeGroup.append("svg:text")
                .attr("text-anchor", function(d)
                {
                    return d.children ? "end" : "start";
                })
                .attr("dx", function(d)
                {
                    var gap = 2 * options.nodeRadius;
                    return d.children ? -gap : gap;
                })
                .attr("dy", 3)
                .text(function(d)
                {
                    return d.name;
                });

            var removeByName = function (name) {
                var node = layoutRoot.selectAll("g.node").filter(function (d) { return d.name === name })
                if (node.data().length !== 1)
                    return
                var children = node.data()[0].contents

                _.each(children, function (child) {
                    layoutRoot.selectAll("path.link").filter(function (d) { return d.source.name === name || d.target.name === name }).remove()
                    removeByName(child.name)
                })

                node.remove()
                nodes = _.filter(nodes, function (node) {
                    return node.name !== name
                })
            }

            var addAsChildByName = function (name, newNode) {
                var node = layoutRoot.selectAll("g.node").filter(function (d) { return d.name === name })
                if (node.data().length !== 1)
                    return
                treeData.contents.push(newNode)
                nodes = tree.nodes(treeData)
                links = tree.links(nodes)

                layoutRoot.selectAll("path.link")
                    .data(links)
                    .enter()
                    .append("svg:path")
                    .attr("class", "link")
                    .attr("d", link);

                var grp = layoutRoot.selectAll("g.node")
                    .data(nodes)
                    .enter()
                    .append('svg:g')
                    .attr("transform", function(d)
                    {
                        return "translate(" + d.y + "," + d.x + ")";
                    })

                grp.append("svg:circle")
                    .attr("class", "node-dot")
                    .attr("r", options.nodeRadius)

                grp.append("svg:text")
                    .attr("text-anchor", function(d)
                    {
                        return d.children ? "end" : "start";
                    })
                    .attr("dx", function(d)
                    {
                        var gap = 2 * options.nodeRadius;
                        return d.children ? -gap : gap;
                    })
                    .attr("dy", 3)
                    .text(function(d)
                    {
                        return d.name;
                    });
            }

            $('#componentTree-content').click(function () { removeByName('Developer'); addAsChildByName('opt', newNode) })
        },
        release: function () {
        },
        cleanup: function () {
        }
    }
})