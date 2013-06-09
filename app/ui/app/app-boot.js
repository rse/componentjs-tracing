/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  bootstrap component system  */
ComponentJS.symbol("cs");
cs.bootstrap();
cs.ns("app.ui.comp");
cs.ns("app.ui.widget");
cs.debug(0);
if (cs.plugin("debugger")) {
    cs.debug(9);
    cs.debug_window({
        enable:    true,
        natural:   true,
        autoclose: false,
        name:      "ComponentJS Chrome Extension",
        width:     800,
        height:    1000
    });
}

/*  once the DOM is ready...  */
$(document).ready(function () {
    /*  load stylesheets  */
    less.env = "production";
    less.async = true;
    less.dumpLineNumbers = "mediaQuery";
    $("head > link[rel='stylesheet/less']").each(function () {
        less.sheets.push(this);
    });
    less.refresh(true);

    /*  load markup templates  */
    $.markup.load(function () {
        /*  fire up application components  */
        cs.create("/sv", app.sv);
        cs("/sv").state("prepared", function () {
            cs.create("/ui/panel", {}, app.ui.comp.panel);
            cs("/ui/panel").state(typeof document !== "undefined" ? "visible" : "prepared");
        });
    });
});

