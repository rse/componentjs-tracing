/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var create = function (verbose) {
    verbose = verbose || false
    return {
        root: null,
        vertices: TAFFY(),
        edges: TAFFY(),
        onStack: {},
        visited: {},
        edgeTo: {},
        verbose: verbose,
        setRoot: function (root) {
            this.root = root
        },
        addVertex: function (params) {
            var id = params.data.id || params.id
            var data = params.data || null
            var v = { id: id, data: data }
            this.vertices.insert(v)
            return v
        },
        addEdge: function (src, trg, weight) {
            weight = weight || 1
            var e = { source: src, target: trg, weight: weight, visited: false }
            this.edges.insert(e)
            return e
        },
        removeEdge: function (e) {
            this.edges({ source: e.source, target: e.target, weight: e.weight }).remove()
            if (this.verbose)
                console.log('Removed ' + e.source + ' -> ' + e.target)
        },
        adjacentEdges: function (v) {
            var result = []
            this.edges({source: v.id}).each(function (r) { result.push(r) })
            return result
        },
        adjacentVertex: function (v, e) {
            return this.vertices({ id: e.source === v.id ? e.target : e.source }).first()
        },
        resetVars: function () {
            this.onStack = {}
            this.visited = {}
            this.edgeTo = {}
        },
        InvalidGraphException: function (message) {
            return {
                message: message,
                name: 'InvalidGraphException'
            }
        },
        dfs: function (v, cycleCallback) {
            if (v === null)
                return
            this.onStack[v.id] = true
            this.visited[v.id] = true
            if (this.verbose)
                console.log('Vertex ' + v.id)

            var adjacent = this.adjacentEdges(v)
            for (var i = 0; i < adjacent.length; i++) {
                var edge = adjacent[i]
                if (this.verbose)
                    console.log('Edge ' + edge.source + ' -> ' + edge.target)

                var w = this.adjacentVertex(v, edge)

                /*  Found new vertex  */
                if (!this.visited[w.id]) {
                    this.edgeTo[w.id] = edge
                    this.dfs(w, cycleCallback)
                /*  Find cycle  */
                }
                else if (this.onStack[w.id]) {
                    var x = edge
                    var cycle = []
                    while (true) {
                        cycle.push(x)
                        /*  We reached the start of the cycle  */
                        if (x.source === w.id)
                            break

                        x = this.edgeTo[x.source]
                    }
                    cycleCallback(cycle)
                }
            }
            this.onStack[v.id] = false

            return
        },
        removeCycles: function () {
            this.resetVars()
            var self = this

            var callback = function (cycle) {
                var removed = false
                for (var i = 0; i < cycle.length; i++) {
                    var edge = cycle[i]
                    /*  Remove only one edge of the cycle  */
                    if (edge.weight === 1) {
                        self.removeEdge(edge)
                        removed = true
                        break
                    }
                }
                if (!removed)
                    throw new this.InvalidGraphException('Detected a cycle, that could not be removed automatically: ' + JSON.stringify(cycle))
            }
            this.dfs(this.root, callback)
        },
        hasCycles: function () {
            this.resetVars()
            var cycles = []

            var callback = function (cycle) {
                var result = []
                for (var i = 0; i < cycle.length; i++) {
                    var edge = cycle[i]

                    result.push({ source: edge.source, target: edge.target, weight: edge.weight })
                }
                cycles.push(result)
            }
            this.dfs(this.root, callback)

            return cycles
        },
        noIncomingEdges: function () {
            var result = []
            var self = this
            this.vertices().each(
                function (vertex) {
                    if (!self.edges({ target: vertex.id, visited: false }).first())
                        result.push(vertex)
            })
            return result
        },
        vertexById: function (id) {
            return this.vertices({id: id}).first()
        },
        outgoingEdges: function (vertex) {
            var result = []
            this.edges({ source: vertex.id, visited: false }).each(function (e) { result.push(e) })
            return result
        },
        incomingEdges: function (vertex) {
            var result = []
            this.edges({ target: vertex.id, visited: false }).each(function (e) {
                result.push(e)
            })
            return result
        },
        topSort: function () {
            var result = []
            var vertices = this.noIncomingEdges()
            while (vertices.length !== 0) {
                var vertex = vertices[0]
                result.push(vertex.data)
                vertices.splice(0, 1)
                var outEdges = this.outgoingEdges(vertex)
                for (var i = 0; i < outEdges.length; i++) {
                    var e = outEdges[i]
                    this.edges({___id: e.___id}).update('visited', true)
                    e.visited = true
                    var v = this.vertexById(e.target)
                    if (this.incomingEdges(v).length === 0)
                        vertices.push(v)
                }
            }
            if (this.edges({ visited: false }).first())
                throw new this.InvalidGraphException('The graph has at least one cycle')
            else {
                this.edges().update('visited', false)
                return result
            }
        }
    }
}

app.lib.graph = create

})()