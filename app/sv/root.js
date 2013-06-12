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

        ctx.srv.io.on('connection', function (socket) {
            console.log('New inbound connection')
            socket.on('disconnect', function () {
                console.log('Client disconnected')
            })
            console.log('Joining tracing queue')
            socket.join('tracingRoom')
        })

        ctx.srv.io.route('trace', function (req) {
            ctx.srv.io.sockets.in('tracingRoom').emit('newTrace', req.data)
        })

        return srv
    }
}