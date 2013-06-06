var os   = require('os');
var http = require('http');
var url  = require('url');
var requestModule = require('request');
var EventEmitter = require('events').EventEmitter;

module.exports.createProxyServer = function (opts) {
    /*  prepare settings  */
    opts = opts || {};
    var proxyHost    = opts.proxyHost               || "127.0.0.1";
    var proxyPort    = parseInt(opts.proxyPort, 10) || 3128;
    var serverName   = opts.serverName              || os.hostname();
    var softwareName = opts.softwareName            || "node-proxy-server";
    var softwareVers = opts.softwareVers            || "0.0.1";

    /*  create event emitting proxy object  */
    var proxyserver = new EventEmitter();

    /*  helper function: emit event or run fallback action  */
    var emitOrRun = function (eventName, callback) {
        if (!proxyserver.listeners(eventName).length)
            callback();
        else {
            var args = Array.prototype.slice.call(arguments);
            args.shift();
            args.shift();
            args.unshift(eventName);
            proxyserver.emit.apply(proxyserver, args);
        }
    };

    /*  helper function: catch errors for request/response callback  */
    var errorWrapper = function (wrapped) {
        return function (req, res) {
            try {
                return wrapped(req, res);
            } catch (error) {
                proxyserver.emit("error", error, "request/response wrapper");
            }
        };
    };

    /*  process the request/response  */
    var serverDefinition = function () {
        return errorWrapper(function (request, response) {
            var onEnabled = function (intercept) {
                var headers = request.headers;

                /*  on response interception ensure there is no compression  */
                if (intercept) {
                    headers["accept-encoding"] = "identity";
                    delete headers["proxy-connection"];
                }

                /*  provide forwarding information (1/2)  */
                var clientIp = request.connection.remoteAddress || request.connection.socket.remoteAddress;
                if (headers["x-forwarded-for"])
                    headers["x-forwarded-for"] = headers["x-forwarded-for"] + ", " + clientIp;
                else
                    headers["x-forwarded-for"] = clientIp;
                headers["forwarded-for"] = headers["x-forwarded-for"];

                /*  provide forwarding information (2/2)  */
                headers.via = request.httpVersion + ' ' + serverName;
                var localAddr = request.connection.address();
                if (localAddr !== null)
                    headers.via += ':' + request.connection.address().port;
                headers.via += ' (' + softwareName + "/" + softwareVers + ')';

                /*  assembly request information  */
                var parsedUrl  = url.parse(request.url);
                var parsedHost = url.parse("http://" + headers.host);
                var requestInfo = {
                    'host':    parsedUrl.hostname || parsedHost.hostname,
                    'port':    parseInt(parsedUrl.port, 10) || parseInt(parsedHost.port, 10) || 80,
                    'path':    parsedUrl.pathname + (parsedUrl.search || '') + (parsedUrl.hash || ''),
                    'method':  request.method,
                    'headers': headers,
                    'encoding': null
                };

                /*  helper function for fixing the upper/lower cases of headers  */
                var fixHeaderCase = function (headers) {
                    var result = {};
                    for (var key in headers) {
                        if (!headers.hasOwnProperty(key))
                            continue;
                        var newKey = key.split('-')
                            .map(function(token) { return token[0].toUpperCase() + token.slice(1); })
                            .join('-');
                        result[newKey] = headers[key];
                    }
                    return result;
                };

                var runRequest = function (requestInfo) {
                    /*  adjust headers  */
                    requestInfo.headers = fixHeaderCase(requestInfo.headers);
                    requestInfo.url = parsedUrl;

                    /*  perform the HTTP client request  */
                    if (requestInfo.url.href.indexOf('localhost') === -1) {
                        //requestInfo.proxy = 'http://proxy.msg.de:3128'
                    }
                    requestModule(requestInfo, function (error, clientResponse, responseBody) {

                        emitOrRun('interceptResponseContent', function () {
                            response.writeHead(clientResponse.statusCode, clientResponse.headers);
                            response.write(responseBody);
                            response.end();
                        }, clientResponse, responseBody, function (clientResponse, responseBody) {
                            response.writeHead(clientResponse.statusCode, clientResponse.headers);
                            response.write(responseBody);
                            response.end();
                        })
                    })
                    /*var proxyRequest = http.request(requestInfo, function (proxyResponse) {
                        //  determine whether content is HTML and hence can be easily intercepted
                        var isHtml = (
                            proxyResponse.headers['content-type'] &&
                            proxyResponse.headers['content-type'].toLowerCase().indexOf("html") !== -1
                        );

                        var writeResponse = function (shouldBuffer) {
                            var buffer;
                            var buffers = [];
                            var bufferLength = 0;

                            if (shouldBuffer) {
                                bufferLength = parseInt(proxyResponse.headers["content-length"], 10) || 0;
                                delete proxyResponse.headers["content-length"];
                                buffer = new Buffer(0);
                            }

                            proxyResponse.on("error", function (error) {
                                response.end();
                                proxyserver.emit("error", error, "proxyResponse", requestInfo);
                            });

                            proxyResponse.on("data", function (chunk) {
                                if (shouldBuffer)
                                    buffers.push(chunk);
                                else
                                    response.write(chunk);
                            });

                            proxyResponse.on("end", function () {
                                if (!shouldBuffer) {
                                    response.end();
                                    proxyserver.emit("completeUnfitered");
                                    return;
                                }

                                var match = (proxyResponse.headers["content-type"] || "").match(/charset=([^;]+)/);
                                var charset = (match ? match[1] : null);

                                var writeResponse = function(buffer) {
                                    response.end(buffer);
                                };

                                buffer = Buffer.concat(buffers, bufferLength);
                                emitOrRun("interceptResponseContent", function () { writeResponse(buffer); },
                                          buffer, proxyResponse, charset, writeResponse);
                            });

                            if (shouldBuffer) {
                                delete proxyResponse.headers["content-encoding"];
                                emitOrRun("interceptResponseHeaders", function () {
                                    response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
                                }, requestInfo, proxyResponse.statusCode, proxyResponse.headers, function (a, b) {
                                    response.writeHead(a, b);
                                });
                            }
                            else
                                response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
                        };

                        if (!intercept)
                            writeResponse(false);
                        else
                            emitOrRun("shouldInterceptResponseContent", function () {
                                writeResponse(isHtml);
                            }, proxyResponse, writeResponse);
                    });

                    proxyRequest.on("error", function (error) {
                        if (error.code === "ENOTFOUND") {
                            response.writeHead(504);
                            response.end("Error - host not found: " + requestInfo.host);
                        }
                        else {
                            response.writeHead(503);
                            response.end();
                        }
                        proxyserver.emit("error", error, "proxyRequest", requestInfo);
                    });*/

                    //request.on("data", function (chunk) { proxyRequest.write(chunk, "binary"); });
                    //request.on("end",  function (chunk) { proxyRequest.end(); });
                };

                emitOrRun("interceptRequest", function () {
                    runRequest(requestInfo);
                }, requestInfo, runRequest);
            };

            var shouldReject = function (reject) {
               if (reject) {
                   response.writeHead(407, {});
                   response.end();
               }
               else
                   emitOrRun("shouldEnableInterception", function () {
                       onEnabled(true);
                   }, onEnabled);
            };
            emitOrRun("shouldReject", function () {
                shouldReject(false);
            }, request, shouldReject);
        });
    };

    /*  create HTTP service  */
    var httpServer = http.createServer(serverDefinition());
    httpServer.listen(proxyPort, proxyHost);
    httpServer.on("clientError", function (error) {
        proxyserver.emit("clientError", error, "proxyClient");
    });
    httpServer.on("upgrade", function (request, socket) {
        console.log('upgraded')
        proxyserver.emit("upgrade", request, socket);
    });
    httpServer.on('error', function (error) {
        proxyserver.emit("error", error, "proxyServer");
    });

    return proxyserver;
};