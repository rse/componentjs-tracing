/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 *  This is a small ComponentJS plugin which traces all
 *  component tree communications.
 *
 *  tracing = <source, sourceType, origin, originType, operation, parameters>
 */

/* global ComponentJS:false, alert:false */
/* jshint unused:false */

ComponentJS.plugin("tracing", function (_cs, $cs, GLOBAL) {
    if (window.chrome === undefined) {
        alert("You can only view this application using Google Chrome.")
        return;
    }

    var startTime = Date.now();
    /*  ensure run-time requirements are met  */
    if (typeof Error.captureStackTrace !== "function")
        throw _cs.exception("plugin:tracing", "sorry, Google Chrome V8's Error.captureStackTrace() is required");

    /*
     *  Tracing Context Class
     */

    var Tracing = (function () {
        var id = 0;
        var mkattr = function (name, val_def) {
            var val = val_def;
            return function (val_new) {
                var val_old = val;
                if (typeof val_new !== "undefined")
                    val = val_new;
                return val_old;
            };
        };
        return $cs.clazz({
            cons: function () {
                this.id = id++;
            },
            dynamics: {
                usage:      0,
                timestamp:  mkattr("timestamp",  null),
                source:     mkattr("source",     null),
                sourceType: mkattr("sourceType", null),
                origin:     mkattr("origin",     null),
                originType: mkattr("originType", null),
                operation:  mkattr("operation",  null),
                parameters: mkattr("parameters", null),
                proxy:      mkattr("proxy",      null)
            },
            protos: {
                flush: function (name) {
                    if (    this.source()     !== null
                        &&  this.sourceType() !== null
                        &&  this.origin()     !== null
                        &&  this.originType() !== null
                        &&  this.operation()  !== null
                        &&  this.parameters() !== null) {
                        this.usage++;
                        this.timestamp(Date.now() - startTime);
                        _cs.hook("ComponentJS:tracing", "none", this);
                    }
                }
            }
        });
    })();

    /*
     *  Run-Time Stack Tracing
     */

    /*  walk the run-time stack trace  */
    Error.stackTraceLimit = Infinity;
    var walkStackTrace = function (callback) {
        /*  use Google Chrome V8's stack tracing facility
            http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi  */
        var pST = Error.prepareStackTrace;
        Error.prepareStackTrace = function (error, stacktrace) {
            for (var i = 0; i < stacktrace.length; i++) {
                var func = stacktrace[i].getFunction();
                if (typeof func !== "function")
                    continue;
                if (callback.call(null, func, stacktrace[i]) === true)
                    break;
            }
        };
        var error = {};
        Error.captureStackTrace(error, walkStackTrace);
        Error.prepareStackTrace = pST;
    };

    /*  determine the tracing context
        (by crawling for it backward in the run-time call stack)  */
    var resolve = function (name) {
        var annotation = null;
        walkStackTrace(function (func) {
            annotation = _cs.annotation(func, name);
            if (annotation !== null)
                return true;
            return false;
        });
        return annotation;
    };

    /*
     *  ComponentJS Latching
     */

    /*  create the pseudo component representing ComponentJS internals  */
    _cs.latch("ComponentJS:bootstrap", function () {
        _cs.internal = new _cs.comp("<internal>", null, []);
    });

    _cs.latch("ComponentJS:state-change", function (req) {
        if (req) {
            var tracing = new Tracing();
            /*  on-the-fly make an implicit tracing source  */
            var source = resolve("tracing:source");

            /*  act on all non-internal sources  */
            if (source && source !== _cs.internal)
                tracing.source(source);
            else
                tracing.source(_cs.none);
            tracing.sourceType('');
            tracing.origin(req.comp);
            tracing.originType(compType(req.comp));
            tracing.operation('state');
            tracing.parameters({ state: req.state });
            tracing.hidden = true;
            tracing.flush();
        }
    })

    _cs.latch("ComponentJS:comp-created", function (comp) {
        var tracing = new Tracing();
        /*  on-the-fly make an implicit tracing source  */
        var source = resolve("tracing:source");

        /*  act on all non-internal sources  */
        if (source && source !== _cs.internal)
            tracing.source(source);
        else
            tracing.source(_cs.none);
        tracing.sourceType('');
        tracing.origin(comp);
        tracing.originType(compType(comp));
        tracing.operation('create');
        tracing.parameters({});
        tracing.hidden = true;
        tracing.flush();
    })

    _cs.latch("ComponentJS:comp-destroyed", function (comp) {
        var tracing = new Tracing();
        /*  on-the-fly make an implicit tracing source  */
        var source = resolve("tracing:source");

        /*  act on all non-internal sources  */
        if (source && source !== _cs.internal)
            tracing.source(source);
        else
            tracing.source(_cs.none);
        tracing.sourceType('');
        tracing.origin(comp);
        tracing.originType(compType(comp));
        tracing.operation('destroy');
        tracing.parameters({});
        tracing.hidden = true;
        tracing.flush();
    })

    /*  latch into the component state enter/leave call hooks
        in order to annotate each enter/leave function with the
        enclosing component  */
    _cs.latch("ComponentJS:state-method-call", function (info) {
        /*  wrap original function and annotate it with tracing source  */
        var proxy = _cs.clone(info.func);
        _cs.annotation(proxy, "tracing:source", info.comp);
        info.func = proxy;
    });

    /*  bridge the tracing source information over callbacks
        (usually setTimeout() or interaction triggered callbacks)  */
    $cs.fn = function (func, isInternal) {
        /*  determine source component  */
        var source;
        if (isInternal === true)
            source = _cs.internal;
        else {
            source = resolve("tracing:source");
        }

        /*  wrap original function and annotate it with tracing source  */
        func = _cs.clone(func);
        _cs.annotation(func, "tracing:source", source);

        return func;
    };

    /*  latch into the internal setTimeout() calls of ComponentJS
        in order to bridge the tracing source information  */
    _cs.latch("ComponentJS:settimeout:func", function (func) {
        return $cs.fn(func, true);
    });

    /*  configure all API methods and their parameters we want to trace  */
    var methods = {
        /*  component management  */
        "create":      [],
        "destroy":     [],

        /*  state handling  */
        "guard":       [ "method", "level" ],
        "state":       [ "state", "sync" ],

        /*  spooling facility  */
        "spool":       [ "name" ],
        "unspool":     [ "name" ],

        /*  property facility  */
        "property":    [ "name", "bubbling", "targeting" ],

        /*  sockets facility  */
        "socket":      [ "name", "scope" ],
        "link":        [ "name", "scope", "target" ],
        "plug":        [ "name" ],
        "unplug":      [],

        /*  model facility  */
        "model":       [ "model" ],
        "observe":     [ "name", "touch", "operation" ],
        "unobserve":   [],
        "value":       [ "name", "value", "force" ],
        "touch":       [ "name" ],

        /*  event facility  */
        "subscribe":   [ "name", "spec", "capturing", "spreading", "bubbling", "exclusive" ],
        "unsubscribe": [],
        "publish":     [ "name", "spec", "async", "capturing", "spreading", "bubbling", "firstonly" ],

        /*  service facility  */
        "register":    [ "name", "async", "capturing", "spreading", "bubbling" ],
        "unregister":  [],
        "call":        [ "name", "capturing", "spreading", "bubbling" ],

        /*  hooking facility  */
        "hook":        [ "name" ],
        "latch":       [ "name" ],
        "unlatch":     []
    };

    var compType = function (comp) {
        var type = {};
        type.view       = $cs.marked(comp === null ? _cs.none.obj() : comp.obj(), "view");
        type.model      = $cs.marked(comp === null ? _cs.none.obj() : comp.obj(), "model");
        type.controller = $cs.marked(comp === null ? _cs.none.obj() : comp.obj(), "controller");
        type.service    = $cs.marked(comp === null ? _cs.none.obj() : comp.obj(), "service");
        return type;
    }

    /*  overload all API functions which are important for tracing  */
    var protos = {};
    _cs.foreach(_cs.keysof(methods), function (method) {
        /*  overload the API method  */
        protos[method] = function () {
            /*  on-the-fly make an implicit tracing source  */
            var source = resolve("tracing:source");

            /*  act on all non-internal sources  */
            if (source !== _cs.internal) {
                /*  wrap base() function for annotation and ensure that
                    our wrapper proxy is able to still resolve "base" through us  */
                var proxy = _cs.clone(this.base);
                _cs.annotation(arguments.callee, "clone", true);

                /*  create, fill and flush new tracing  */
                var tracing = new Tracing();
                tracing.proxy(proxy);
                tracing.source(source);
                tracing.sourceType(compType(source));
                tracing.origin(this);
                tracing.originType(compType(this));
                tracing.operation(method);
                if (methods[method].length === 0) {
                    /*  set parameters and immediately flush tracing  */
                    tracing.parameters({});
                    tracing.flush();

                    /*  annotate the wrapper proxy to indicate to sub-sequent
                        calls that we are internal from now on until revised  */
                    _cs.annotation(proxy, "tracing:source", _cs.internal);
                }
                else {
                    /*  defer further processing until internal "params"
                        function processed arguments  */
                    _cs.annotation(proxy, "tracing:context", tracing);
                }

                /*  pass-through execution to base method (via proxy)  */
                return proxy.apply(this, arguments);
            }
            else
                return this.base.apply(this, arguments);
        };

        /*  hook into the API method parameter processing  */
        if (methods[method].length > 0) {
            _cs.latch("ComponentJS:params:" + method + ":leave", function (info) {
                /*  deferred processing  */
                var source = resolve("tracing:source");
                if (source !== _cs.internal) {
                    var tracing = resolve("tracing:context");
                    if (tracing !== null) {
                        /*  finally set parameters and perform the deferred tracing flushing  */
                        var params = {};
                        for (var i = 0; i < methods[method].length; i++) {
                            var name = methods[method][i];
                            params[name] = info.params[name];
                        }
                        tracing.parameters(params);
                        tracing.flush();

                        /*  annotate the wrapper proxy to indicate to sub-sequent
                            calls that we are internal from now on until revised  */
                        var proxy = tracing.proxy();
                        _cs.annotation(proxy, "tracing:source", _cs.internal);
                    }
                }
            });
        }
    });
    var trait = $cs.trait({
        protos: protos
    });
    _cs.latch("ComponentJS:bootstrap:comp:mixin", function (mixins) {
        mixins.push(trait);
    });
});
