/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.scroll.panel')

app.ui.widget.scroll.panel.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this
            var scrollPanel = $.markup('scroll-panel')

            cs(self).plug(scrollPanel)

            cs(self).socket({
                ctx: $(scrollPanel)
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})