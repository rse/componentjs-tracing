/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function () {

var pattern = /^[^<]*< ([^,]*), ([^,]*), ([^,]*), ([^,]*), ([^,]*), ([^,]*), (.*) >/

var tokens =  function () { return {
        data: [],
        add: function (token) {
            this.data.push(token)
        },
        len: function () {
            return this.data.length
        },
        first: function (offs) {
            if (offs === undefined) {
                return this.data[0]
            }
            return this.data[offs]
        },
        consume: function (symbol) {
            if (symbol !== this.data[0]) {
                if (symbol === '}' && this.data[0] === undefined)
                    throw new Error('parse error: we are missing a closing }')
                else
                    throw new Error('parse error: could not consume token "' + symbol +'", actual token "' + this.data[0] + '"')
            }
            this.data = this.data.slice(1, this.data.length)
        },
        skip: function () {
            this.data = this.data.slice(1, this.data.length)
        }
    }
}

var tokenize = function (src) {
    var tkns = new tokens()
    var match
    while(src !== '') {
        match = src.match(/^(\s*)(["'][^"']*["']|[^\[\]()):{}\/,\s]+|[():{}\[\]\/,])(\s*)/)
        if (match === null)
            throw new Error('parse error: "' + src + '"')
        tkns.add(match[2])
        src = src.substr(match[0].length)
    }

    return tkns
}

var parseObject = function (param, params) {
    while (params.first() !== '}') {
        if (params.first() === ',')
            params.skip()
        if (params.first() === ']') {
            params.skip()
            params.skip()
        }
        if (params.first(2) === '{') {
            var obj = {}
            if (!_.isArray(param))
                param[params.first()] = obj
            else
                param.push(obj)
            params.skip()
            params.skip()
            params.skip()
            parseObject(obj, params)
        }
        else if (params.first(2) === '[') {
            var ary = []
            if (!_.isArray(param))
                param[params.first()] = ary
            else
                param.push(ary)
            params.skip()
            params.skip()
            params.skip()
            parseObject(ary, params)
        }
        else {
            var rest = JSON.parse(params.first(2))
            if (!_.isArray(param))
                param[params.first()] = rest
            else
                param.push(rest)
            params.skip()
            params.skip()
            params.skip()
        }
    }
}

var parseLog = function (lines) {
    var traces = []
    return traces
}

app.lib.traceParser = {}
app.lib.traceParser.parseLog = parseLog

})()