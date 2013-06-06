/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var graph = window.graph();

var sort = function (constraintSet) {
    //  Set the after relation for rules that are not included in the order yet
    var last = graph.addVertex({data: {id: 'first'} });
    var root = last;
    var vertices = [ root ];
    for (var i = 0; i < constraintSet.length; i++) {
        var constraint = constraintSet[i];
        if (constraint.constraints) {
            constraint.constraints = sort(constraint.constraints);
        }
        var vertex = graph.addVertex({ data: constraint });
        var dependencies = constraint.constraintBody.dependencies;

        //  Create a vertex in the dependency graph for this rule
        vertices.push(vertex);
        //  Add the implicit dependency, resulting of the rule order within the file
        graph.addEdge(last.id, vertex.id);
        //  Create edges in the dependency graph for the after and before relationships
        for (var x = 0; x < dependencies.after.length; x++) {
            graph.addEdge(dependencies.after[x], vertex.id, 2);
        }
        for (var y = 0; y < dependencies.before.length; y++) {
            graph.addEdge(vertex.id, dependencies.before[y], 2);
        }
        // Remember current rule
        last = vertex;
    }
    //Ensure that the 'last' node really comes last
    for (var k = 0; k < vertices.length; k++) {
        graph.addEdge(vertices[k].id, 'last');
    }
    // Add 'last' node
    graph.addVertex({ data: {id: 'last'} });
    graph.setRoot(root);
    graph.removeCycles();

    //  Sort the rules according to their ordering before- and after-relation
    constraintSet = graph.topSort();
    var clearedConstraintSet = [];
    // Filter artificial 'first' and 'last' node out
    for (var z = 0; z < constraintSet.length; z++) {
        var constr = constraintSet[z];
        if (constr.id !== 'first' && constr.id !== 'last') {
            clearedConstraintSet.push(constr);
        }
    }
    return clearedConstraintSet;
};

window.sorter = sort;

})();