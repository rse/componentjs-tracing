/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

module.paths = module.paths.concat(module.parent.paths);

var express    = require('express')
var express_io = require('express.io')

module.exports = {
    setup: function (ctx) {
        var srv = express_io()
        srv.http().io()
        srv.disable('x-powered-by')

        srv.use(express.bodyParser())
        srv.use(express.methodOverride())

        var buffer = []

        /*  a client can subscribe itself to incoming traces by issuing a 'join' message  */
        ctx.srv.io.route('join', function (req) {
            req.io.join('tracingRoom')
            for (var i = 0; i < buffer.length; i++) {
                req.io.emit('newTrace', buffer[i])
            }
            /*  clear the buffer after flushing  */
            buffer = []
        })

        /*  new traces can be transfered to the server using the 'trace' message with the trace as payload  */
        ctx.srv.io.route('trace', function (req) {
            var clients = ctx.srv.io.sockets.clients('tracingRoom')
            for (var i = 0; i < clients.length; i++) {
                clients[i].emit('newTrace', req.data)
            }
            /*  buffer incoming traces when no client is present yet  */
            if (clients.length === 0) {
                buffer.push(req.data)
            }
        })

        return srv
    }
}