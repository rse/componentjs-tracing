/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
/* globals btoa: false */

app.ui.widget.grid = cs.clazz({
    mixin: [ cs.marker.controller ],
    dynamics: {
        selectable: true
    },
    cons: function (selectable) {
        if (selectable === false)
            this.selectable = selectable
    },
    protos: {
        create: function () {
            var self = this
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(self).create('model/view',
                app.ui.widget.grid.model,
                new app.ui.widget.grid.view(self.selectable)
            )

            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (columns) {
                    cs(self, 'model').value('data:columns', columns)
                }
            })

            cs(self).register({
                name: 'unshift', spool: 'created',
                func: function (trace) {
                    cs(self, 'model').value('state:add-pos', 'top')
                    cs(self, 'model').value('data:new-item', trace, true)
                }
            })

            cs(self).register({
                name: 'push', spool: 'created',
                func: function (trace) {
                    cs(self, 'model').value('state:add-pos', 'bottom')
                    cs(self, 'model').value('data:new-item', trace, true)
                }
            })

            cs(self).register({
                name: 'update', spool: 'created',
                func: function (trace) {
                    cs(self, 'model').value('state:add-pos', 'update')
                    cs(self, 'model').value('data:new-item', trace, true)
                }
            })

            cs(self).register({
                name: 'traces' , spool: 'created',
                func: function (traces) {
                    if (traces)
                        cs(self, 'model').value('data:rows', traces, true)
                    else
                        return cs(self, 'model').value('data:rows')
                }
            })

            cs(self).register({
                name: 'clear', spool: 'created',
                func: function () {
                    cs(self, 'model').value('data:rows', [])
                }
            })

            cs(self).register({
                name: 'filter', spool: 'created',
                func: function (filter) {
                    cs(self, 'model').value('state:filter', filter)
                }
            })
        },
        show: function () {
            var self = this

            cs(self, 'model').observe({
                name: 'data:selected-obj', spool: '..:visible',
                touch: true,
                func: function (ev, nVal) {
                    cs(self).publish('objectSelected', nVal)
                }
            })

            cs(self, 'model').observe({
                name: 'state:visible-rows', spool: '..:visible',
                touch: true,
                func: function (ev, nVal) {
                    cs(self).publish('event:status-message', nVal + ' items')
                }
            })
        }
    }
})

app.ui.widget.grid.model = cs.clazz({
    mixin: [ cs.marker.model ],
    protos: {
        checkFilter: function (trace) {
            var filter = cs(this).value('state:filter')
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
        },
        create: function () {
            var self = this

            /*  presentation model for items  */
            cs(self).model({
                'data:columns'       : { value: [],   valid: '[{ label: string, dataIndex: string, width?: number, align?:string, renderer?:any }*]' },
                'state:selection'    : { value: -1,   valid: 'number'    },
                'state:filter'       : { value: '',   valid: 'string', store: true },
                'state:add-pos'      : { value: 'top',valid: 'string'              },
                'data:selected-obj'  : { value: null, valid: 'object'              },
                'data:filtered'      : { value: [],   valid: '[object*]'           },
                'data:rows'          : { value: [],   valid: '[object*]'           },
                'data:new-item'      : { value: null, valid: 'object'              },
                'state:visible-rows' : { value: 0,    valid: 'number'              }
            })

            cs(self).observe({
                name: 'data:rows', spool: 'created',
                operation: 'changed',
                func: function () {
                    cs(self).touch('state:filter')
                }
            })

            cs(self).observe({
                name: 'data:new-item', spool: 'created',
                func: function (ev, item) {
                    if (!item)
                        return
                    var action = cs(self).value('state:add-pos')
                    var passed = self.checkFilter(item)
                    if (action === 'top') {
                        console.log('top@model:' + item.id)
                        cs(self).value('data:rows').unshift(item)
                        if (passed)
                            cs(self).value('data:filtered').unshift(item)
                    }
                    else if (action === 'bottom') {
                        console.log('bottom@model' + item.id)
                        cs(self).value('data:rows').push(item)
                        if (passed)
                            cs(self).value('data:filtered').push(item)
                    }
                    else if (action === 'update') {
                        console.log('update@model' + item.id)
                        /*  fix position in unfiltered array  */
                        var unfiltered = cs(self).value('data:rows')
                        var oldIdx = _.indexOf(unfiltered, item)
                        _.each(unfiltered, function (trace, idx) {
                            if (idx === oldIdx)
                                return false
                            if (trace.occurence <= item.occurence) {
                                unfiltered.splice(oldIdx, 1)
                                unfiltered.splice(idx, 0, item)
                                return false
                            }
                        })
                    }
                    if (!passed)
                        ev.result(null)
                }
            })
        },
        show: function () {
            var self = this

            cs(self).observe({
                name: 'state:filter', spool: 'visible',
                operation: 'changed',
                touch: true,
                func: function (ev, filter) {
                    var unfiltered = cs(self).value('data:rows')
                    if (filter === '')
                        cs(self).value('data:filtered', unfiltered)
                    else {
                        var result = []
                        result = _.filter(unfiltered, function (trace) {
                            return self.checkFilter(trace)
                        })
                        cs(self).value('data:filtered', result)
                    }
                }
            })
        }
    }
})

app.ui.widget.grid.view = cs.clazz({
    mixin: [ cs.marker.view ],
    dynamics: {
        selectable: true,
        grid: null
    },
    cons: function (selectable) {
        if (selectable === false)
            this.selectable = selectable
    },
    protos: {
        render: function () {
            var self = this
            self.grid = $.markup('grid')

            cs(self).plug(self.grid)

            /*  react on selection change  */
            cs(self).observe({
                name: 'state:selection', spool: 'materialized',
                touch: true,
                func: function (ev, nVal) {
                    if (nVal !== -1) {
                        var rows = cs(self).value('data:rows')
                        var objIdx = _.findIndex(rows, function (row) { return row.id === nVal })
                        cs(self).value('data:selected-obj', rows[objIdx])
                        $('.selected', self.grid).removeClass('selected')
                        $('.table > .tbody > .row', self.grid[2]).eq(objIdx).addClass('selected')
                    }
                    else
                        cs(self).value('data:selected-obj', null)
                }
            })
        },
        show: function () {
            var self = this

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
                if (self.selectable) {
                    row.addClass('selectable')
                    row.click(function () {
                        cs(self).value('state:selection', $(this).data('i'))
                    })
                }
            }

            /*  render existing columns */
            cs(self).observe({
                name: 'data:columns', spool: 'visible',
                touch: true,
                func: function (ev, columns) {
                    _.each(columns, function (col) {
                        var vars = { label: col.label }
                        if (col.width)
                            vars.style = 'width: ' + col.width + 'px;'
                        $('.thead > .row', self.grid).markup('grid/column', vars)
                    })
                }
            })

            /*  render existing items  */
            cs(self).observe({
                name: 'data:filtered', spool: 'visible',
                touch: true,
                func: function (ev, items) {
                    $('.tbody tr', this.grid).remove()
                    _.each(items, function (item) {
                        var row = $('.tbody', self.grid).markup('grid/row', { i: item.id })
                        fillRow(row, item)
                    })
                    /*  reset selection  */
                    cs(self).value('state:selection', -1)
                    /*  update item counter  */
                    cs(self).value('state:visible-rows', items.length)
                }
            })

            cs(self).observe({
                name: 'data:new-item', spool: 'visible',
                operation: 'changed',
                func: function (ev, item) {
                    if (!item)
                        return
                    var action = cs(self).value('state:add-pos')
                    var row = $.markup('grid/row', { i: item.id })
                    fillRow(row, item)
                    if (action === 'top') {
                        console.log('top@view:' + item.id)
                        $('.tbody', self.grid).prepend(row)
                        cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                    }
                    else if (action === 'bottom') {
                        console.log('bottom@view:' + item.id)
                        $('.tbody', self.grid).append(row)
                        cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                    }
                    else if (action === 'update') {
                        console.log('update@view:' + item.id)
                        $('#statistics-content .tbody > .row[data-i=' + item.id + ']').replaceWith(row)
/*                        var unfiltered = cs(self).value('data:filtered')
                        var oldIdx = _.indexOf(unfiltered, item)
                        var line = $('#statistics-content .tbody > .row').eq(oldIdx)
                        _.each(unfiltered, function (trace, idx) {
                            if (idx === oldIdx) {
                                line.replaceWith(row)
                                return false
                            }
                            if (trace.occurence <= item.occurence) {
                                $('#statistics-content .tbody > .row').eq(idx).before(row)
                                unfiltered.splice(oldIdx, 1)
                                line.remove()
                                unfiltered.splice(idx, 0, item)
                                return false
                            }
                        })*/
                    }
                }
            })
        },
        hide: function () {
            $('.tbody tr', this.grid).remove()
            cs(this).value('state:visible-rows', 0)
        }
    }
})
