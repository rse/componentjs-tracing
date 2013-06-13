/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function (factory) {
    var name = "tracing";
    if (typeof exports === "object")
        exports[name] = factory();
    else if (typeof define === "function" && typeof define.amd === "object")
        define(name, function () { return factory(); });
    else
        window[name] = factory();
})(function () {
    var api = {};

    api.instrument = function (symbol, source) {
        var input = source;
        var output = "";

        var stack = [];
        var m, consume;
        while (input !== "") {
            consume = -1;

            /*  comment (block variant)  */
            if ((m = input.match(/^\/\*.*\*\//)) !== null) {}

            /*  comment (EOL variant)  */
            else if ((m = input.match(/^\/\/[^\r\n]*\r?\n/)) !== null) {}

            /*  string (double-quoted)  */
            else if ((m = input.match(/^"(\\"|[^"])*"/)) !== null) {}

            /*  string (single-quoted)  */
            else if ((m = input.match(/^'(\\'|[^'])*'/)) !== null) {}

            /*  regular expression  */
            else if ((m = input.match(/^\/(\\\/|[^\/])*\//)) !== null) {}

            /*  life-cycle functions  */
            else if (output.match(/(?:prepare|cleanup|create|destroy|render|release|show|hide):\s*$/) !== null) {
                m = input.match(/^function\s*\(.*?\)\s*\{/)
            }

            /*  start of function  */
            else if ((m = input.match(/^function\s*\(.*?\)\s*\{/)) !== null) {
                stack.push("function");
                output += symbol + ".fn(";
            }

            /*  any other opening brace  */
            else if ((m = input.match(/^\{/)) !== null) {
                stack.push("other");
            }

            /*  end of function or any other closing brace  */
            else if ((m = input.match(/^\}/)) !== null) {
                output += input.substr(0, m[0].length);
                input = input.substr(m[0].length);
                var type = stack.pop();
                if (type === "function")
                    output += ")";
                consume = 0;
            }

            /*  any other prefix  */
            else if ((m = input.match(/^([^\/"'f{}]+)/)) !== null) {}

            /*  any other character  */
            else
                consume = 1;

            /*  input to output shifting  */
            if (consume === -1) {
                if (m !== null) consume = m[0].length;
                else            consume = 0;
            }
            if (consume > 0) {
                output += input.substr(0, consume);
                input = input.substr(consume);
            }
        }

        return output;
    };

    return api;
});