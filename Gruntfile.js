/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global module: true */
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            options: {
                jshintrc: "jshint.json",
                ignores:  [ "app/ui/app/lib-grammar.js" ]
            },
            gruntfile:   [ "Gruntfile.js" ],
            sourcefiles: [ "server.js", "app/sv/*.js", "app/ui/app/app-*.js" ]
        },
        peg: {
            constraints: {
                grammar:    "app/ui/app/lib-grammar.peg",
                outputFile: "app/ui/app/lib-grammar.js",
                exportVar:  "app.lib.constraint_parser"
            }
        },
        clean: {
            clean:     [ "app/ui/app/lib-grammar.js" ],
            distclean: [ "node_modules" ]
        }
    });

    grunt.loadNpmTasks("grunt-peg");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.registerTask("default", [ "peg", "jshint" ]);
    grunt.registerTask("grammar", [ "peg" ]);
};

