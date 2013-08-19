/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.trace.details')

app.ui.widget.trace.details.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            /*  presentation model for items  */
            cs(this).model({
                'data:trace' : { value: null, valid: 'object' }
            })
        }
    }
})

app.ui.widget.trace.details.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this
            var details = $.markup('trace-details')

            cs(self).plug(details)

            cs(self).observe({
                name: 'data:trace', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    if (nVal !== null) {
                        $('.time', details).text(nVal.time)
                        $('.source', details).text(nVal.source)
                        $('.source-type', details).text(nVal.sourceType)
                        $('.origin', details).text(nVal.origin)
                        $('.origin-type', details).text(nVal.originType)
                        $('.operation', details).text(nVal.operation)
                        $('.parameters', details).text(JSON.stringify(nVal.parameters))
                    }
                    else {
                        $('.time', details).text('')
                        $('.source', details).text('')
                        $('.source-type', details).text('')
                        $('.origin', details).text('')
                        $('.origin-type', details).text('')
                        $('.operation', details).text('')
                        $('.parameters', details).text('')
                    }
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})