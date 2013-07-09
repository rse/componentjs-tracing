/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

cs.ns('app.ui.widget.grid')

app.ui.widget.grid.ctrl = cs.clazz({
    mixin: [ cs.marker.controller ],
    dynamics: {
        selectable: true
    },
    cons: function (selectable) {
        if (selectable === false) {
            this.selectable = selectable
        }
    },
    protos: {
        create: function () {
            var self = this

            cs(self).create('gridModel/view',
                app.ui.widget.grid.model,
                new app.ui.widget.grid.view(self.selectable)
            )

            cs(self).register({
                name: 'unshift', spool: 'created',
                func: function (trace) {
                    var tuples = cs(self, 'gridModel').value('data:rows')
                    tuples.unshift(trace)
                    cs(self, 'gridModel').value('data:rows', tuples)
                    cs(self, 'gridModel/view').call('unshift', trace)
                }
            })

            cs(self).register({
                name: 'save', spool: 'created',
                func: function () {
                    /* global btoa */
                    window.location = 'data:application/octet-stream;base64,'+
                        btoa(cs(self, 'gridModel').value('data:savable'))
                }
            })

            cs(self).register({
                name: 'tuples' , spool: 'created',
                func: function (tuples) {
                    if (tuples) {
                        cs(self, 'gridModel').value('data:rows', tuples, true)
                    } else {
                        return cs(self, 'gridModel').value('data:rows')
                    }
                }
            })

            cs(self).register({
                name: 'columns', spool: 'created',
                func: function (columns) {
                    cs(self, 'gridModel').value('data:columns', columns)
                }
            })

            cs(self).register({
                name: 'clear', spool: 'created',
                func: function () {
                    cs(self, 'gridModel').value('data:rows', [])
                }
            })

            cs(self).register({
                name: 'filter', spool: 'created',
                func: function (filter) {
                    cs(self, 'gridModel').value('state:filter', filter)
                }
            })

            cs(self, 'gridModel').observe({
                name: 'data:selected-obj', spool: '..:rendered',
                touch: true,
                func: function (ev, nVal) {
                    cs(self).publish('objectSelected', nVal)
                }
            })
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

app.ui.widget.grid.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        create: function () {
            var self = this

            var validTuplesSet = '[{ id?: number, time: number, source: string, sourceType: string,' +
                ' origin: string, originType: string, operation: string,' +
                ' parameters: any, result?: string, checks?: any }*]'

            /*  presentation model for items  */
            cs(self).model({
                'data:columns'      : { value: [],   valid: '[{ label: string, dataIndex: string, width?: number, align?:string, renderer?:any }*]' },
                'state:selection'   : { value: -1,   valid: 'number' },
                'state:filter'      : { value: '',   valid: 'string' },
                'data:selected-obj' : { value: null, valid: 'object' },
                'data:savable'      : { value: '',   valid: 'string' },
                'data:filtered'     : { value: [],   valid: validTuplesSet },
                'data:rows'         : { value: [],   valid: validTuplesSet }
            })

            cs(self).observe({
                name: 'data:rows', spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    cs(self).value('data:filtered', nVal, true)
                }
            })

            cs(self).observe({
                name: 'state:filter', spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    var unfiltered = cs(self).value('data:rows')
                    if (nVal === '')
                        cs(self).value('data:filtered', unfiltered)
                    else {
                        var result = []

                        var tmp = nVal.split(':')

                        for (var i = 0; i < unfiltered.length; i++) {
                            var tuple = unfiltered[i]
                            /*  expand abbreviations for sourceType and originType  */
                            if (tmp[0] === 'OT')
                                tmp[0] = 'originType'
                            if (tmp[0] === 'ST')
                                tmp[0] = 'sourceType'
                            if (tmp.length === 2 && tuple[tmp[0]]) {
                                if (tuple[tmp[0]].toLowerCase().indexOf(tmp[1].toLowerCase()) !== -1)
                                    result.push(tuple)
                            }
                            else {
                                for (var key in tuple) {
                                    if (key === 'time' || key === 'id' || key === 'checks')
                                        continue;
                                    var val = tuple[key]
                                    if (key === 'parameters')
                                        val = JSON.stringify(val)
                                    if (val.toLowerCase().indexOf(nVal.toLowerCase()) !== -1) {
                                        result.push(tuple)
                                        break;
                                    }
                                }
                            }
                        }
                        cs(self).value('data:filtered', result)
                    }
                }
            })

            /*  calculate the savable content on demand  */
            cs(self).observe({
                name: 'data:savable', spool: 'created',
                operation: 'get',
                touch: true,
                func: function (ev) {
                    var result = ''
                    var rows = cs(self).value('data:filtered')

                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i]

                        /*  stringify parameters  */
                        var params = "";
                        var p = row.parameters;
                        for (var name in p) {
                            if (params !== "")
                                params += ", ";
                            params += name + ": " + JSON.stringify(p[name]);
                        }
                        if (params !== "")
                            params = "{ " + params + " }";
                        else
                            params = "{}";

                        result += '< ' +
                            row.time + ', ' +
                            row.source + ', ' +
                            row.sourceType + ', ' +
                            row.origin + ', ' +
                            row.originType + ', ' +
                            row.operation + ', ' +
                            params + ' > \n'
                    }
                    result = result.substr(0, result.length - 1)
                    ev.result(result)
                }
            })
        },
        destroy: function () {
            cs(this).unspool('created')
        }
    }
})

app.ui.widget.grid.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        selectable: true
    },
    cons: function (selectable) {
        if (selectable === false) {
            this.selectable = selectable
        }
    },
    protos: {
        render: function () {
            var self = this
            var grid = $.markup('grid')

            cs(self).plug(grid)

            cs(self).observe({
                name: 'data:columns', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    for (var i = 0; i < nVal.length; i++) {
                        var vars = { label: nVal[i].label }
                        if (nVal[i].width)
                            vars.style = 'width: ' + nVal[i].width + 'px;'
                        $('.thead > .row', grid).markup('grid/column', vars)
                    }
                }
            })

            var fillRow = function (row, trace) {
                var columns = cs(self).value('data:columns')
                for (var x = 0; x < columns.length; x++) {
                    var vars = { style: '' }
                    if (columns[x].dataIndex === 'parameters')
                        vars.label = JSON.stringify(trace[columns[x].dataIndex])
                    else
                        if (columns[x].renderer)
                            vars.label = columns[x].renderer(trace[columns[x].dataIndex])
                        else
                            vars.label = trace[columns[x].dataIndex]
                    if (columns[x].width)
                        vars.style += 'width: ' + columns[x].width + 'px;'
                    if (columns[x].align)
                        vars.style += 'text-align: ' + columns[x].align + ';'
                    $(row).markup('grid/row/data', vars)
                }
            }

            cs(self).register({
                name: 'unshift', spool: 'rendered',
                func: function (trace) {
                    trace.style = ''
                    var i = $('.tbody > .row:first', grid).data('i')
                    if (typeof i === 'undefined')
                        i = -1
                    var row = $.markup('grid/row', { i: ++i })
                    fillRow(row, trace);
                    delete trace.style
                    $('.tbody', grid).prepend(row)
                    if (self.selectable) {
                        row.addClass('selectable')
                        row.click(function () {
                            var len = cs(self).value('data:rows').length
                            cs(self).value('state:selection', len - $(this).data('i') - 1)
                        })
                    }
                }
            })

            cs(self).observe({
                name: 'data:filtered', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    $('.tbody tr', grid).remove()
                    for (var i = 0; i < nVal.length; i++) {
                        var row = $('.tbody', grid).markup('grid/row', { i: nVal.length - 1 - i })
                        fillRow(row, nVal[i])
                    }
                    cs(self).value('state:selection', -1)
                    if (self.selectable) {
                        var rows = $('.table > .tbody > .row', grid[2])
                        rows.addClass('selectable')
                        rows.click(function () {
                            var len = cs(self).value('data:rows').length
                            cs(self).value('state:selection', len - $(this).data('i') - 1)
                        })
                    }
                }
            })

            /*  react on selection change  */
            cs(self).observe({
                name: 'state:selection', spool: 'rendered',
                touch: true,
                func: function (ev, nVal) {
                    if (nVal !== -1) {
                        cs(self).value('data:selected-obj', cs(self).value('data:rows')[nVal])
                        $('.selected', grid).removeClass('selected')
                        $('.table > .tbody > .row', grid[2]).eq(nVal).addClass('selected')
                    }
                    else
                        cs(self).value('data:selected-obj', null)
                }
            })
        },
        release: function () {
            cs(this).unspool('rendered')
        }
    }
})
