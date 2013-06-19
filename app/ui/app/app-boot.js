/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global alert: true */
/* global less: true */
/* global app: true */

/*  bootstrap component system  */
ComponentJS.symbol("cs")
cs.bootstrap()

/*  configure component system debugging  */
cs.debug(0)
if (cs.plugin("debugger")) {
    if (cs.debug_instrumented()) {
        cs.debug(9)
        cs.debug_window({
            enable:    true,
            natural:   true,
            autoclose: false,
            name:      "ComponentJS Tracing",
            width:     800,
            height:    800
        })
    }
}

/*  create application namespaces  */
cs.ns("app.lib")
cs.ns("app.ui.comp")
cs.ns("app.ui.widget")

/*  once the DOM is ready...  */
$(document).ready(function () {
    /*  we really need Google Chrome's feature set  */
    if (window.chrome === undefined) {
        alert("You can only view this application using Google Chrome.")
        return;
    }

    /*  load stylesheets  */
    less.env = "production"
    less.async = true
    less.dumpLineNumbers = "mediaQuery"
    $("head > link[rel='stylesheet/less']").each(function () {
        less.sheets.push(this)
    })
    less.refresh(true)

    /*  load markup templates  */
    $.markup.load(function () {
        /*  fire up application components  */
        cs.create("/sv", app.sv)
        cs("/sv").state("prepared", function () {
            cs.create("/ui/panel", {}, app.ui.comp.panel)
            cs("/ui/panel").state(typeof document !== "undefined" ? "visible" : "prepared")
        })
    })
})
