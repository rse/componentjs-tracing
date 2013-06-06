/*
**  server.js -- platform-independent server startup script
**  Copyright (c) 2013 Ralf S. Engelschall <rse@engelschall.com>
*/

/*  program identification  */
var app = {
    name: "Server",
    vers: "0.0.0",
    date: "2013-01-01",
    logger: null
};

/*  determine path to server base directory  */
var basedir = __dirname;

/*  load required libraries (1/3)  */
var fs       = require("fs");
var path     = require("path");

/*  determine path to Node library directory  */
var libdir = path.resolve(path.join(basedir, "/lib/node_modules/"));
module.paths.unshift(libdir);
libdir = path.resolve(path.join(basedir, "/lib/local/"));
module.paths.unshift(libdir);

/*  load required libraries (2/3)  */
var ini      = require("node-ini");
var util     = require("util")
var dashdash = require("dashdash");

/*  default command-line value loading  */
var argv = [];
var config = ini.parseSync(path.join(basedir, "/server.ini"));
if (typeof config.server !== "undefined") {
    for (var name in config.server) {
        if (config.server.hasOwnProperty(name)) {
            if (typeof config.server[name] === "string") {
                argv.push("--" + name);
                argv.push(config.server[name]);
            }
            else if (config.server[name] instanceof Array) {
                for (var i = 0; i < config.server[name].length; i++) {
                    argv.push("--" + name);
                    argv.push(config.server[name][i]);
                }
            }
        }
    }
}
for (var i = 2; i < process.argv.length; i++)
    argv.push(process.argv[i]);

/*  die the reasonable way  */
var die = function (msg) {
    console.error("server: ERROR: %s", msg)
    process.exit(1)
};

/*  command-line argument parsing  */
var options = [
    {   name: "version", type: "bool", default: false,
        help: "Print tool version and exit." },
    {   names: [ "help", "h" ], type: "bool", default: false,
        help: "Print this help and exit." },
    {   names: [ "addr", "a" ], type: "string", default: "127.0.0.1",
        help: "IP address to listen", helpArg: "ADDRESS" },
    {   names: [ "port", "p" ], type: "integer", default: 8080,
        help: "TCP port to listen", helpArg: "PORT" },
    {   names: [ "backlog", "b" ], type: "integer", default: 511,
        help: "TCP socket connection backlog", helpArg: "CONNECTIONS" },
    {   names: [ "componentjs" , "cjs" ], type: "string", default: ".*\/component.js",
        help: "Regex matching the url of the ComponentJS file", helpArg: "REGEX" },
    {   names: [ "components", "cmps" ], type: "string", default: ".*/app/.*",
        help: "Regex matching the urls of the components files of the SPA", helpArg: "REGEX" },
    {   names: [ "app", "A" ], type: "arrayOfString", default: "",
        help: "application to load", helpArg: "APP" }
]
var parser = dashdash.createParser({
    options: options,
    interspersed: false
})
try {
    var opts = parser.parse(argv)
} catch (e) {
    die(e.message)
}
if (opts.help) {
    var help = parser.help().trimRight()
    console.log(
        "server: USAGE: server [options] [arguments]\n" +
        "options:\n" +
        help
    )
    process.exit(0)
}
else if (opts.version) {
    console.log(util.format("%s %s (%s)", app.name, app.vers, app.date))
    process.exit(0)
}
// console.log("opts:", opts)
// console.log("args:", opts._args)

/*  load required libraries (3/3)  */
var path            = require("path");
var util            = require("util");
var cors            = require("cors");
var express         = require("express");
var express_io      = require("express.io");
var express_winston = require("express-winston");
var winston         = require("winston");

/*  create a server logger  */
var loggerTransport = new winston.transports.File({
    filename: "server.log",
    handleExceptions: true,
    maxsize: 1024*1024,
    maxFiles: 10,
    json: false,
    colorize: false
});
app.logger = new (winston.Logger)({
    transports: [ loggerTransport ]
});
app.logger.log("info", "starting %s %s (%s)", app.name, app.vers, app.date);
process.on("uncaughtException", function (error) {
    app.logger.log("error", error);
    console.log("server: ERROR: " + error);
});

/*  establish a root server  */
var srv = express_io();
srv.http().io();
app.srv = srv;

/*  adjust server identification  */
srv.enable("trust proxy");
srv.disable("x-powered-by");
srv.use(function (req, res, next) {
    res.setHeader("Server", util.format("%s %s (%s)", app.name, app.vers, app.date));
    next();
});

/*  allow to be used behind a reverse proxy  */
srv.enable("trust proxy");

/*  support CORS  */
srv.use(cors(function (req, cb) {
    var options = { origin: false, credentials: true };
    if (typeof req.header("Origin") === "string")
        options.origin = true;
    cb(null, options);
}));

/*  access logging  */
srv.use(express_winston.logger({
    transports: [
        new winston.transports.File({
            filename: "server.access.log",
            maxsize: 1024*1024,
            maxFiles: 10,
            json: false,
            colorize: false
        })
    ]
}));

/*  make an Express server from custom JavaScript code  */
var mkAppJS = function (filename) {
    var mod;
    try        { mod = require(filename); }
    catch (ex) { die("failed to load JavaScript module \"" + filename + "\": " + ex.message); }
    if (typeof mod.setup !== "function")
        die("JavaScript module does not export \"setup\" function: " + filename);
    var srv = mod.setup(app);
    return srv;
};

/*  make an Express server as standard directory listing  */
var mkAppDir = function (dirname) {
    var srv = express();
    srv.disable("x-powered-by");
    srv.use(express.favicon(dirname + "/favicon.ico", { maxAge: 24*60*60*1000 }));
    srv.use(express.compress());
    srv.use(express.responseTime());
    srv.use(express.static(dirname, { maxAge: 1*60*60*1000 }));
    return srv;
};

/*  iterate over all configured servers  */
if (typeof opts.app === "undefined")
    die("no application(s) defined");
for (var i = 0; i < opts.app.length; i++) {
    /*  parse application specification  */
    var m = (opts.app[i] + "").match(/^(.+):(.+)$/);
    if (m === null)
        die("invalid app specification (has to be \"<url-prefix>:<file-or-dir-path>\")");
    var url = m[1];
    var src = m[2];

    /*  sanity check parameters  */
    if (!url.match(/^\//))
        die("invalid URL prefix (has to start with a slash)");
    if (!fs.existsSync(src))
        die("invalid app source: \"" + src + "\"  (has to be either JavaScript file or directory)");

    /*  determine type of Express application  */
    var stats = fs.statSync(src);
    var subsrv;
    if (stats.isFile()) {
        app.logger.log("info", "deploying custom app: url=%s src=%s", url, src);
        subsrv = mkAppJS(src);
    }
    else if (stats.isDirectory()) {
        var index = src + "/root.js";
        if (fs.existsSync(index) && fs.statSync(index).isFile()) {
            app.logger.log("info", "deploying custom app: url=%s src=%s", url, index);
            subsrv = mkAppJS(index);
        }
        else {
            app.logger.log("info", "deploying directory-index: url=%s src=%s", url, src);
            subsrv = mkAppDir(src);
        }
    }

    /*  configure as sub-server  */
    srv.use(url, subsrv);
}

/*  configure a fallback middleware  */
srv.use(function(req, res, next) {
    res.send(404, "Resource Not Found");
});

/*  error logging  */
srv.use(express_winston.errorLogger({
    level: "info",
    transports: [ loggerTransport ]
}));

/*  error logging  */
srv.use(express.errorHandler({ dumpExceptions: false, showStack: false }));

var hps = require("http-proxy-simple");

var myProxy = hps.createProxyServer({
    proxyHost: "127.0.0.1",
    proxyPort: 8129
});

myProxy.on("error", function (error, locationInfo) {
   console.log("Location: " + locationInfo);
   console.log("Error: " + error.stack);
});

var cjsFile = new RegExp(opts.componentjs)
var cmpFiles = new RegExp(opts.components)

myProxy.on("interceptResponseContent", function (clientResponse, responseBody, callback) {
    console.log('interceptResponseContent: ' + clientResponse.req.path)
    if (clientResponse.req.path.match(cjsFile) !== null) {
        var buffer = new Buffer(responseBody, 'utf8')
        var appended = new Buffer('alert("Pommes");', 'utf8')
        var finalBuffer = new Buffer(buffer.length + appended.length)

        buffer.copy(finalBuffer)
        appended.copy(finalBuffer, buffer.length)

        responseBody = finalBuffer.toString('utf8')
        var length = finalBuffer.length
        /*  Make sure the file is never loaded from cache  */
        clientResponse.statusCode = 200
        clientResponse.headers["content-length"] = length
        clientResponse.headers["content-type"] = 'application/javascript'
        clientResponse.headers["accept-ranges"] = 'bytes'
        //FIXME only replace HIT with MISS, when present
        //clientResponse.headers["x-cache"] = clientResponse.headers["x-cache"].replace('HIT', 'MISS')
        //clientResponse.headers["x-cache-lookup"] = clientResponse.headers["x-cache-lookup"].replace('HIT', 'MISS')
        console.log('Discovered CJS file')
    } else if (clientResponse.req.path.match(cmpFiles) !== null) {
        console.log('Discovered component file')
    }
    callback(clientResponse, responseBody);
});

/*  start the listening on the root server  */
srv.listen(opts.port, opts.addr, opts.backlog, function () {
    app.logger.log("info", "listening on http://%s:%d", opts.addr, opts.port);
});
