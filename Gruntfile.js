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
                ignores:  [ "app/ui/app/lib-cjscp-grammar.js", "app/ui/app/lib-cjsct-grammar.js" ]
            },
            gruntfile: [ "Gruntfile.js" ],
            sourcefiles: [
                "componentjs-tracing.js",
                "app/sv/*.js",
                "app/ui/app/app-*.js"
            ]
        },
        peg: {
            peephole: {
                src:  "app/ui/app/lib-cjscp-grammar.peg",
                dest: "app/ui/app/lib-cjscp-grammar.js",
                options: {
                    exportVar: "module.exports",
                    allowedStartRules: [ "spec", "binding" ],
                    optimize: "speed",
                    cache: true
                }
            },
            temporal: {
                src:  "app/ui/app/lib-cjsct-grammar.peg",
                dest: "app/ui/app/lib-cjsct-grammar.js",
                options: {
                    exportVar: "module.exports",
                    allowedStartRules: [ "spec", "binding" ],
                    optimize: "speed",
                    cache: true
                }
            }
        },
        clean: {
            clean:     [ "app/ui/app/lib-cjscp-grammar.js", "app/ui/app/lib-cjsct-grammar.js" ],
            grammar:   [ "app/ui/app/lib-cjscp-grammar.peg", "app/ui/app/lib-cjsct-grammar.peg" ],
            distclean: [ "node_modules" ]
        },
        "expand-include": {
            temporalGrammar: {
                src: [ "app/ui/app/grammar-fragments/lib-cjsct-grammar.main" ],
                dest: "app/ui/app/lib-cjsct-grammar.peg",
                directiveSyntax: "js"
            },
            peepholeGrammar: {
                src: [ "app/ui/app/grammar-fragments/lib-cjscp-grammar.main" ],
                dest: "app/ui/app/lib-cjscp-grammar.peg",
                directiveSyntax: "js"
            }
        }
    });                                     grunt

    /*  load foreign tasks  */
    require("load-grunt-tasks")(grunt, { pattern: "grunt-*" });

    grunt.registerTask("default", [ "grammar" /* "jshint" */ ]);
    grunt.registerTask("grammar", [ "expand-include", "peg", "clean:grammar" ]);
}
