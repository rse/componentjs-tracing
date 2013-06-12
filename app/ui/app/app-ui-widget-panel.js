/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns("app.ui.widget.panel")

/*  widget model  */
app.ui.widget.panel.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            /*  presentation model for tabs  */
            cs(this).model({
                "data:tabs":        { value: [], valid: "[{ id: string, name: string }*]" },
                "state:active-tab": { value: -1, valid: "number", store: true }
            })
        }
    }
})

/*  widget view  */
app.ui.widget.panel.view = cs.clazz({
    mixin: [ cs.marker.view ],
    protos: {
        render: function () {
            var self = this

            /*  plug mask into parent  */
            var ui = $.markup("widget-panel")
            cs(self).plug(ui);

            cs(this).socket({
                ctx: $('#statusbar-container'),
                scope: 'statusbar'
            })

            /*  render tabs  */
            var tab2socket = []
            cs(self).observe({
                name: "data:tabs", spool: "materialized", touch: true,
                func: function (ev, tabs) {
                    /*  remove potentially still existing tabs  */
                    var i
                    if (tab2socket.length > 0) {
                        $(".tabs > *", ui).remove()
                        $(".content > *", ui).remove()
                        for (i = 0; i < tab2socket.length; i++)
                            cs(self).unsocket(tab2socket[i])
                        tab2socket = []
                    }

                    /*  render new tabs  */
                    for (i = 0; i < tabs.length; i++) {
                        $(".tabs", ui).markup("widget-panel/tab", { i: i, name: tabs[i].name })
                        var content = $(".contents", ui).markup("widget-panel/content")
                        var id = cs(self).socket({ scope: tabs[i].id, ctx: $(content), type: "jquery" })
                        tab2socket.push(id)
                    }

                    /*  enforce active tab  */
                    if (cs(self).value("state:active-tab") > tab2socket.length - 1)
                        cs(self).value("state:active-tab", tab2socket.length - 1)
                    else
                        cs(self).touch("state:active-tab")
                }
            })

            /*  react on active tab change  */
            cs(self).observe({
                name: "state:active-tab", spool: "materialized", touch: true,
                func: function (ev, active) {
                    if (active > cs(self).value("data:tabs").length)
                        throw new Error("invalid tab number to activate")
                    $(".tabs .tab.active", ui).removeClass("active")
                    $(".tabs .tab", ui).eq(active).addClass("active")
                    $(".contents .content.active", ui).removeClass("active")
                    $(".contents .content", ui).eq(active).addClass("active")
                }
            })

            /*  react on tab click  */
            $(".tabs .tab").click(function () {
                cs(self).value("state:active-tab", $(this).data("i"))
            })
        },
        release: function () {
            cs(this).unspool("materialized")
        }
    }
})

