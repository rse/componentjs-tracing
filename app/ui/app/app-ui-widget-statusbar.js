/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.statusbar')

app.ui.widget.statusbar = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this

            cs(self).create('model/view', app.ui.widget.statusbar.model, app.ui.widget.statusbar.view)

            cs(self).subscribe({
                name: 'message', spool: 'created',
                func: function (ev, nVal) {
                    cs(self, 'model').value('state:message', nVal)
                }
            })

            cs(self).subscribe({
                name: 'color', spool: 'created',
                func: function (ev, nVal) {
                    cs(self, 'model').value('state:color', nVal)
                }
            })
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

app.ui.widget.statusbar.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            cs(this).model({
                'state:message' : { value: 'Not connected', valid: 'string' },
                'state:color'   : { value: 'black', valid: 'string'}
            })
        }
    }
})

/*  widget view  */
app.ui.widget.statusbar.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this

            /*  plug mask into parent  */
            var content = $.markup('statusbar')

            cs(self).plug(content)

            cs(self).observe({
                name: 'state:message', spool: 'rendered', touch: true,
                func: function (ev, nVal) {
                    $('.statusbar-message', content).text(nVal)
                }
            })

            cs(self).observe({
                name: 'state:color', spool: 'rendered', touch: true,
                func: function (ev, nVal) {
                    $('.statusbar-icon', content).css('background-image', 'url(static/img/bullet_' + nVal + '.png)');  
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})