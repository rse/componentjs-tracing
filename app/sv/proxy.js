/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

module.paths = module.paths.concat(module.parent.paths);

var fs         = require("fs")
var path       = require("path")
var express    = require("express")
var express_io = require("express.io")

module.exports = {
    setup: function (ctx, opts) {
        var tracing = require(path.join(ctx.basedir, "assets/transpiler/transpiler-lib.js")).tracing;

        ctx.logger.log("info", "listening on http://%s:%d for PROXY requests", opts.proxyaddr, opts.proxyport);
        var proxyserver = require("http-proxy-simple").createProxyServer({
            host:  opts.proxyaddr,
            port:  opts.proxyport,
            proxy: opts.proxyfwd
        });

        proxyserver.on("http-request", function (cid, request) {
           ctx.logger.log("info", "proxy: " + cid + ": HTTP request: " + request.url);
        });

        proxyserver.on("http-error", function (cid, error) {
           ctx.logger.log("info", "proxy: " + cid + ": HTTP error: " + error);
        });

        /*  get supplied arguments, identifying the ComponentJS library file and the ctxlication component files  */
        var cjsFile  = new RegExp(opts.componentjs)
        var cmpFiles = new RegExp(opts.components)

        proxyserver.on("http-intercept-request", function (cid, request, response, remoteRequest, performRequest) {
            /*  ensure we always get a non-cached result back  */
            delete remoteRequest.headers["if-modified-since"];
            delete remoteRequest.headers["if-none-match"];
            performRequest(remoteRequest);
        })

        proxyserver.on("http-intercept-response", function (cid, request, response, remoteResponse, remoteResponseBody, performResponse) {
            /*  Did we inject anything? If yes, fix the HTTP request  */
            var finishResponse = function () {
                /*  Make sure the file is never marked as loaded from cache  */
                remoteResponse.statusCode = 200;
                remoteResponse.headers["content-length"] = remoteResponseBody.length;
                remoteResponse.headers["content-type"] = "ctxlication/javascript";
                remoteResponse.headers["accept-ranges"] = "bytes";

                /*  Take care of the caching headers  */
                var cacheControl = remoteResponse.headers["x-cache"];
                if (cacheControl)
                    cacheControl = cacheControl.replace("HIT", "MISS");
                cacheControl = remoteResponse.headers["x-cache-lookup"];
                if (cacheControl)
                    cacheControl = cacheControl.replace("HIT", "MISS");
            };

            if (remoteResponse.req.path.match(cjsFile) !== null) {
                /*  Convert the remoteResponseBody to a string  */
                remoteResponseBody = remoteResponseBody.toString("utf8");
                ctx.logger.log("info", "proxy: discovered ComponentJS file: " + request.url);

                /*  Which files do we want to be injected?  */
                var filesToInject = [
                    path.join(ctx.basedir, "assets/plugins/component.plugin.tracing.js"),
                    path.join(ctx.basedir, "assets/socket.io.js"),
                    path.join(ctx.basedir, "assets/plugins/component.plugin.tracing-remote.js")
                ];

                /*  Should the latest version of ComponentJS be injected as well?  */
                if (opts.latestcjs) {
                    ctx.logger.log("info", "proxy: injecting the latest ComponentJS version");
                    filesToInject.unshift(path.join(ctx.basedir, "assets/component.js"));
                    remoteResponseBody = "";
                }

                /*  Now inject each file */
                for (var i = 0; i < filesToInject.length; i++) {
                    /*  Load the file to inject to a temporary string  */
                    var ctxend = fs.readFileSync(filesToInject[i]).toString("utf8");
                    /*  Append file to the responseBody  */
                    remoteResponseBody += ctxend;
                }

                ctx.logger.log("info", "proxy: ctxend necessary plug-ins and libraries");
                finishResponse();
            } else if (remoteResponse.req.path.match(cmpFiles) !== null) {
                /*  read original remoteResponseBody, instrument it and write instrumented remoteResponseBody  */
                remoteResponseBody = remoteResponseBody.toString("utf8");
                remoteResponseBody = tracing.instrument("cs", remoteResponseBody);

                ctx.logger.log("info", "proxy: transpiled component file: " + request.url);
                finishResponse();
            }

            performResponse(remoteResponse, remoteResponseBody);
        })

        return null
    }
}
