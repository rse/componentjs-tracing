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
        if (params.first(2) === '{') {
            var obj = {}
            param[params.first()] = obj
            params.skip()
            params.skip()
            params.skip()
            parseObject(obj, params)
        }
        else {
            param[params.first()] = JSON.parse(params.first(2))
            params.skip()
            params.skip()
            params.skip()
        }
    }
}

var parseLog = function (lines) {
    var tuples = []
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var matches = line.match(pattern)
        var params = tokenize(matches[7])
        params.skip()
        var param = {}
        parseObject(param, params)
        var newTuple = {
            time: parseInt(matches[1], 10),
            source: matches[2],
            sourceType: matches[3],
            origin: matches[4],
            originType: matches[5],
            operation: matches[6],
            parameters: param
        }
        tuples.push(newTuple)
    }

    tuples.sort(function (a, b) { return b.time - a.time })

    return tuples
}

app.lib.tupleParser = {}
app.lib.tupleParser.parseLog = parseLog

})()