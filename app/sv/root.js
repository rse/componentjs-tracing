/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* jshint unused:false*/

module.paths = module.paths.concat(module.parent.paths);

var path       = require("path");
var util       = require("util");
var express    = require("express");
var express_io = require("express.io");

module.exports = {
    setup: function (ctx) {
        var srv = express_io();
        srv.http().io();
        srv.disable("x-powered-by");

        srv.use(express.bodyParser());
        srv.use(express.methodOverride());

        ctx.srv.io.route('join', function (req, res) {
            req.io.join('tracingRoom')
            console.log('joining tracingRoom')
        })

        ctx.srv.io.route('trace', function (req, res) {
            req.io.room('tracingRoom').broadcast('newTrace', req.data)
        })

        return srv;
    }
};

