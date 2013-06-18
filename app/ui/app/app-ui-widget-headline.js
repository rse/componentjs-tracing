/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns("app.ui.widget.headline")

/*  widget view  */
app.ui.widget.headline.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            cs(this).plug($.markup("widget-headline"))
        }
    }
})