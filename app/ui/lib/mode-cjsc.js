/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

ace.define('ace/mode/cjsc', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/javascript_highlight_rules', 'ace/mode/matching_brace_outdent', 'ace/range', 'ace/worker/worker_client', 'ace/mode/behaviour/cstyle', 'ace/mode/folding/cstyle'], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var Tokenizer = require("../tokenizer").Tokenizer;
var cjscHighlightRules = require("./cjsc_highlight_rules").cjscHighlightRules;

var Mode = function() {
    var highlighter = new cjscHighlightRules();
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

ace.define('ace/mode/cjsc_highlight_rules', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/javascript_highlight_rules', 'ace/mode/matching_brace_outdent', 'ace/range', 'ace/worker/worker_client', 'ace/mode/behaviour/cstyle', 'ace/mode/folding/cstyle'], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var cjscHighlightRules = function() {
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = { start:
       [{
            token: 'keyword',
            regex: 'temporal-constraint|peephole-constraint|rationale'
        }, {
            token: 'keyword',
            regex: 'condition|sequence|filter|link'
        }, {
            token: 'keyword',
            regex: 'result'
        }, {
            token: 'keyword.operator',
            regex: '==|!=|<=|>=|<|>|=~|!~|!|&&|\\|\\|'
        }, {
            token: 'function',
            regex: 'isParent|distance|contains'
        }, {
            token: 'constant',
            regex: 'sourceType|originType|operation|origin|source|parameters'
        }, {
            token: 'constant',
            regex: 'last|first|PASS_FINAL|FAIL_FINAL|PASS|FAIL'
        }, {
            token: 'string',
            regex: /'(.*)'/
        }
       ]
    }
    this.normalizeRules();
};

oop.inherits(cjscHighlightRules, TextHighlightRules);

exports.cjscHighlightRules = cjscHighlightRules;
});