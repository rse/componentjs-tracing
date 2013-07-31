/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var sort = function (constraintSet) {
    /*  Set the after relation for rules that are not included in the order yet  */
    var graph = app.lib.graph()
    var last = graph.addVertex({data: {id: 'first'} })
    var root = last
    var vertices = [ root ]
    _.map(constraintSet, function (constraint) {
        if (constraint.constraints)
            constraint.constraints = sort(constraint.constraints)
        var vertex = graph.addVertex({ data: constraint })
        var dependencies = constraint.constraintBody.dependencies

        /*  Create a vertex in the dependency graph for this rule  */
        vertices.push(vertex)
        /*  Add the implicit dependency, resulting of the rule order within the file  */
        graph.addEdge(last.id, vertex.id)
        /*  Create edges in the dependency graph for the after and before relationships  */
        _.map(dependencies.after, function (after) {
            graph.addEdge(after, vertex.id, 2)
        })
        _.map(dependencies.before, function (before) {
            graph.addEdge(vertex.id, before, 2)
        })
        /*  Remember current rule  */
        last = vertex
    })
    /*  Ensure that the 'last' node really comes last  */
    _.map(vertices, function (vertex) {
        graph.addEdge(vertex.id, 'last')
    })
    /*  Add 'last' node  */
    graph.addVertex({ data: {id: 'last'} })
    graph.setRoot(root)
    graph.removeCycles()

    /*  Sort the rules according to their ordering before- and after-relation  */
    constraintSet = graph.topSort()
    var clearedConstraintSet = []
    /*  Filter artificial 'first' and 'last' node out  */
    _.map(constraintSet, function (constr) {
        if (constr.id !== 'first' && constr.id !== 'last')
            clearedConstraintSet.push(constr)
    })
    return clearedConstraintSet
}

app.lib.sorter = sort

})()