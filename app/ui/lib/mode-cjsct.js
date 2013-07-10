/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

ace.define('ace/mode/cjstc', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/javascript_highlight_rules', 'ace/mode/matching_brace_outdent', 'ace/range', 'ace/worker/worker_client', 'ace/mode/behaviour/cstyle', 'ace/mode/folding/cstyle'], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var Tokenizer = require("../tokenizer").Tokenizer;
var cjsctHighlightRules = require("./cjsct_highlight_rules").cjsctHighlightRules;

var Mode = function() {
    var highlighter = new cjsctHighlightRules();
    this.$tokenizer = new Tokenizer(highlighter.getRules());
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = "//";
    this.blockComment = {start: "/*", end: "*/"};
    // Extra logic goes here.
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define('ace/mode/cjsct_highlight_rules', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/javascript_highlight_rules', 'ace/mode/matching_brace_outdent', 'ace/range', 'ace/worker/worker_client', 'ace/mode/behaviour/cstyle', 'ace/mode/folding/cstyle'], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var cjsctHighlightRules = function() {
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = { start:
       [{
            token: 'keyword',
            regex: 'temporal-constraint|rationale'
        }, {
            token: 'keyword',
            regex: 'sequence'
        }, {
            token: 'keyword',
            regex: 'filter'
        }, {
            token: 'keyword',
            regex: 'link'
        }, {
            token: 'keyword.operator',
            regex: '==|!=|<=|>=|<|>|=~|!~|!|&&|\\|\\|'
        }, {
            token: 'function',
            regex: 'parent|distance|contains'
        }, {
            token: 'constant',
            regex: 'sourceType|originType|operation|origin|source'
        }, {
            token: 'string',
            regex: /'(.*)'/
        }
       ]
    }
    this.normalizeRules();
};

oop.inherits(cjsctHighlightRules, TextHighlightRules);

exports.cjsctHighlightRules = cjsctHighlightRules;
});