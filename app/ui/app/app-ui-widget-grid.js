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
                    if (!cs(self, 'gridModel').call('checkFilter', trace))
                        return
                    cs(self, 'gridModel').call('unshift', trace)
                    cs(self, 'gridModel/view').call('unshift', trace)
                }
            })

            cs(self).register({
                name: 'push', spool: 'created',
                func: function (trace) {
                    if (!cs(self, 'gridModel').call('checkFilter', trace))
                        return
                    cs(self, 'gridModel').call('push', trace)
                    cs(self, 'gridModel/view').call('push', trace)
                }
            })

            cs(self).register({
                name: 'update', spool: 'created',
                func: function (trace) {
                    cs(self, 'gridModel/view').call('update', trace)
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
                name: 'traces' , spool: 'created',
                func: function (traces) {
                    if (traces) {
                        cs(self, 'gridModel').value('state:visible-rows', traces.length)
                        cs(self, 'gridModel').value('data:rows', traces, true)
                    }
                    else
                        return cs(self, 'gridModel').value('data:rows')
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
                    cs(self, 'gridModel').value('state:visible-rows', 0)
                    cs(self, 'gridModel').value('data:rows', [])
                }
            })

            cs(self, 'gridModel').observe({
                name: 'data:filtered', spool: '..:created',
                func: function (ev, items) {
                    cs(self, 'gridModel').value('state:visible-rows', items.length)
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
        show: function () {
            var self = this

            cs(self, 'gridModel').observe({
                name: 'state:visible-rows', spool: '..:shown',
                touch: true,
                func: function (ev, nVal) {
                    cs(self).publish('event:status-message', nVal + ' items')
                }
            })
        },
        hide: function () {
            cs(this).unspool('shown')
            cs(this).publish('event:status-message', '')
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

            /*  presentation model for items  */
            cs(self).model({
                'data:columns'       : { value: [],   valid: '[{ label: string, dataIndex: string, width?: number, align?:string, renderer?:any }*]' },
                'state:selection'    : { value: -1,   valid: 'number'    },
                'state:filter'       : { value: '',   valid: 'string'    },
                'data:selected-obj'  : { value: null, valid: 'object'    },
                'data:savable'       : { value: '',   valid: 'string'    },
                'data:filtered'      : { value: [],   valid: '[object*]' },
                'data:rows'          : { value: [],   valid: '[object*]' },
                'state:visible-rows' : { value: 0,    valid: 'number'    }
            })

            cs(self).observe({
                name: 'data:rows', spool: 'created',
                touch: true,
                func: function (ev, nVal) {
                    cs(self).value('data:filtered', nVal, true)
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'created',
                func: function (trace) {
                    cs(self).value('data:filtered').unshift(trace)
                    cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                }
            })

            cs(self).register({
                name: 'push', spool: 'created',
                func: function (trace) {
                    cs(self).value('data:filtered').push(trace)
                    cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                }
            })

            cs(self).register({
                name: 'checkFilter', spool: 'created',
                func: function (trace) {
                    var filter = cs(self).value('state:filter')
                    var tmp = filter.split(':')
                    /*  expand abbreviations for sourceType and originType  */
                    if (tmp[0] === 'OT')
                        tmp[0] = 'originType'
                    if (tmp[0] === 'ST')
                        tmp[0] = 'sourceType'
                    if (tmp.length === 2 && trace[tmp[0]])
                        return trace[tmp[0]].toLowerCase().indexOf(tmp[1].toLowerCase()) !== -1
                    else
                        return trace.filter(filter)
                }
            })

            cs(self).observe({
                name: 'state:filter', spool: 'created',
                operation: 'changed', touch: true,
                func: function (ev, nVal) {
                    var unfiltered = cs(self).value('data:rows')
                    if (nVal === '')
                        cs(self).value('data:filtered', unfiltered, true)
                    else {
                        var result = []
                        result = _.filter(unfiltered, function (trace) {
                            return cs(self).call('checkFilter', trace)
                        })
                        cs(self).value('data:filtered', result, true)
                    }
                }
            })

            /*  calculate the savable content on demand  */
            cs(self).observe({
                name: 'data:savable', spool: 'created',
                operation: 'get',
                touch: true,
                func: function (ev) {
                    var result = []
                    var rows = cs(self).value('data:filtered')

                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i]

                        /*  stringify parameters  */
                        var params = ''
                        var p = row.parameters
                        for (var name in p) {
                            if (params !== '')
                                params += ', '
                            params += name + ': ' + JSON.stringify(p[name])
                        }
                        if (params !== '')
                            params = '{ ' + params + ' }'
                        else
                            params = '{}';

                        result.push('< ' +
                            row.time + ', ' +
                            row.source + ', ' +
                            row.sourceType + ', ' +
                            row.origin + ', ' +
                            row.originType + ', ' +
                            row.operation + ', ' +
                            params + ' >')
                    }
                    ev.result(result.join(' \n'))
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
        if (selectable === false)
            this.selectable = selectable
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
                name: 'update', spool: 'rendered',
                func: function (nTrace) {
                    var unfiltered = cs(self).value('data:rows')
                    var oldIdx = _.indexOf(unfiltered, nTrace)
                    var line = $('#statistics-content .tbody > .row').eq(oldIdx)
                    var row = $.markup('grid/row', { i: nTrace.id })
                    fillRow(row, nTrace)
                    _.each(unfiltered, function (trace, idx) {
                        if (idx === oldIdx) {
                            line.replaceWith(row)
                            return false
                        }
                        if (trace.occurence <= nTrace.occurence) {
                            var beforeThis = $('#statistics-content .tbody > .row').eq(idx)
                            line.remove()
                            unfiltered.splice(oldIdx, 1)
                            row.insertBefore(beforeThis)
                            unfiltered.splice(idx, 0, nTrace)
                            return false
                        }
                    })
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'rendered',
                func: function (trace) {
                    var i = $('.tbody > .row:first', grid).data('i')
                    if (typeof i === 'undefined')
                        i = -1
                    var row = $.markup('grid/row', { i: trace.id })
                    fillRow(row, trace)
                    $('.tbody', grid).prepend(row)
                    if (self.selectable) {
                        row.addClass('selectable')
                        row.click(function () {
                            cs(self).value('state:selection', $(this).data('i'))
                        })
                    }
                }
            })

            cs(self).register({
                name: 'push', spool: 'rendered',
                func: function (trace) {
                    var row = $.markup('grid/row', { i: trace.id })
                    fillRow(row, trace)
                    $('.tbody', grid).append(row)
                    if (self.selectable) {
                        row.addClass('selectable')
                        row.click(function () {
                            cs(self).value('state:selection', $(this).data('i'))
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
                        var row = $('.tbody', grid).markup('grid/row', { i: nVal[i].id })
                        fillRow(row, nVal[i])
                    }
                    cs(self).value('state:selection', -1)
                    if (self.selectable) {
                        var rows = $('.table > .tbody > .row', grid[2])
                        rows.addClass('selectable')
                        rows.click(function () {
                            cs(self).value('state:selection', $(this).data('i'))
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
                        var rows = cs(self).value('data:rows')
                        var objIdx = _.findIndex(rows, function (row) { return row.id === nVal })
                        cs(self).value('data:selected-obj', rows[objIdx])
                        $('.selected', grid).removeClass('selected')
                        $('.table > .tbody > .row', grid[2]).eq(objIdx).addClass('selected')
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
