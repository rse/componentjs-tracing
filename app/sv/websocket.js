/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

var fs = require('fs')
module.paths = module.paths.concat(module.parent.paths)

module.exports = {
    setup: function (ctx, opts) {
        var buffer = []

        /*  a client can subscribe itself to incoming traces by issuing a "join" message  */
        ctx.srv.io.route("join", function (req) {
            /*  join the tracing room  */
            req.io.join("tracingRoom")

            /*  flush the current buffer messages  */
            for (var i = 0; i < buffer.length; i++)
                req.io.emit("newTrace", buffer[i])
            buffer = []
        })

        /*  new traces can be transfered to the server using the "trace" message with the trace as payload  */
        ctx.srv.io.route("trace", function (req) {
            var clients = ctx.srv.io.sockets.clients("tracingRoom")

            if (opts.runfile !== '') {
                var stringify = function (obj) {
                    var seen = []
                    return JSON.stringify(obj, function(key, val) {
                       if (typeof val === "object") {
                            if (seen.indexOf(val) >= 0)
                                return
                            seen.push(val)
                        }
                        return val
                    })
                }
                var result = '< ' +
                    req.data.id + ', ' +
                    req.data.time + ', ' +
                    req.data.source + ', ' +
                    req.data.sourceType + ', ' +
                    req.data.origin + ', ' +
                    req.data.originType + ', ' +
                    req.data.operation + ', ' +
                    stringify(req.data.parameters) + ' > \n'

                fs.appendFile(opts.runfile, result, function (err) {
                    if (err)
                        console.log('The error ' + err.toString() + ' occurred during logging to file ' + opts.runfile)
                })
            }
            else if (clients.length === 0) {
                /*  buffer incoming traces when no client is present yet  */
                buffer.push(req.data)
            }
            else {
                /*  send new trace to all clients in the tracing room  */
                for (var i = 0; i < clients.length; i++)
                    clients[i].emit("newTrace", req.data)
            }
        })

        ctx.srv.io.route("cmd", function (req) {
            var clients = ctx.srv.io.sockets.clients()
            for (var i = 0; i < clients.length; i++) {
                if (req.socket.id !== clients[i].id)
                    clients[i].emit("cmd", req.data)
            }
        })

        return null
    }
}
