/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

app.ui.widget.grid = cs.clazz({
    mixin: [ cs.marker.controller ],
    protos: {
        create: function () {
            var self = this
            cs(this).property('ComponentJS:state-auto-increase', true)
            cs(self).create('model/view',
                app.ui.widget.grid.model,
                app.ui.widget.grid.view
            )

            cs(self).register({
                name: 'initialize', spool: 'created',
                func: function (cfg) {
                    cs(self, 'model').value('data:columns', cfg.columns)
                    cs(self, 'model').value('param:selectable', cfg.selectable)
                    cs(self, 'model').value('state:sorting', cfg.sorting || null)
                }
            })

            cs(self).register({
                name: 'insert', spool: 'created',
                func: function (trace) {
                    cs(self, 'model').value('data:insert', trace, true)
                }
            })

            cs(self).register({
                name: 'traces' , spool: 'created',
                func: function (traces) {
                    if (traces)
                        _.each(traces, function (trace) { cs(self, 'model').value('data:insert', trace, true) })
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
        },
        hide: function () {
            cs(this).publish('event:status-message', '')
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
                if (typeof trace[tmp[0]] === 'number')
                    return trace[tmp[0]] === parseInt(tmp[1], 10)
                else
                   return trace[tmp[0]].toLowerCase().indexOf(tmp[1].toLowerCase()) !== -1
            else
                return trace.filter(filter)
        },
        create: function () {
            var self = this

            /*  presentation model for items  */
            cs(self).model({
                'data:columns'       : { value: [],   valid: '[{ label: string, dataIndex: string, width?: number, align?:string, renderer?:any }*]' },
                'state:selection'    : { value: -1,   valid: 'number'                                                                                },
                'state:filter'       : { value: '',   valid: 'string', store: true                                                                   },
                'state:add-pos'      : { value: 'top',valid: '(number|string)'                                                                       },
                'data:selected-obj'  : { value: null, valid: 'object'                                                                                },
                'data:filtered'      : { value: [],   valid: '[object*]'                                                                             },
                'data:rows'          : { value: [],   valid: '[object*]'                                                                             },
                'data:insert'        : { value: null, valid: 'object'                                                                                },
                'data:new-item'      : { value: null, valid: '(number|object)'                                                                       },
                'param:selectable'   : { value: true, valid: 'boolean'                                                                               },
                'state:sorting'      : { value: null, valid: 'object'                                                                                },
                'state:visible-rows' : { value: 0,    valid: 'number'                                                                                }
            })

            cs(self).observe({
                name: 'data:insert', spool: 'created',
                func: function (ev, item) {
                    var sorting = cs(self).value('state:sorting')
                    if (!sorting) {
                        cs(self).value('state:add-pos', 'top')
                        cs(self).value('data:new-item', item, true)
                    }
                    else {
                        var filtered = cs(self).value('data:filtered')
                        var unfiltered = cs(self).value('data:rows')
                        var passed = self.checkFilter(item)
                        var compare = function (a, b) {
                            if (!a || !b)
                                return 42
                            var attrA = a[sorting.dataIndex]
                            var attrB = b[sorting.dataIndex]
                            if (attrA < attrB)
                                return -1
                            else if (attrA > attrB)
                                return 1
                            else
                                return 0
                        }
                        var binarySearch = function (ary, item, direction, start, end) {
                            var mid = Math.floor((start + end) / 2)
                            var comparison = compare(item, ary[mid])
                            if (comparison === 0 || mid === start)
                                return mid + 1/*(direction === 'desc' ? 1 : 0)*/
                            else if (comparison === (direction === 'desc' ? 1 : -1))
                                return binarySearch(ary, item, direction, start, mid)
                            else if (comparison === (direction === 'desc' ? -1 : 1))
                                return binarySearch(ary, item, direction, mid, end)
                        }
                        var sortIn = function (ary, view) {
                            var oldIdx = _.findIndex(ary, function (itm) {return itm.id === item.id })
                            if (oldIdx !== -1) {
                                ary.splice(oldIdx, 1)
                                if (view) {
                                    cs(self).value('state:add-pos', 'remove')
                                    cs(self).value('data:new-item', oldIdx, true)
                                }
                            }
                            var firstCmp = compare(item, ary[0])
                            var lastCmp = compare(item, ary[ary.length - 1])
                            if (ary.length === 0 || firstCmp === 0 || firstCmp === (sorting.direction === 'desc' ? 1 : -1 )) {
                                ary.unshift(item)
                                if (view) {
                                    cs(self).value('state:add-pos', 'top')
                                    cs(self).value('data:new-item', item, true)
                                }
                            }
                            else if (lastCmp === 0 || lastCmp === (sorting.direction === 'desc' ? -1 : 1)) {
                                ary.push(item)
                                if (view) {
                                    cs(self).value('state:add-pos', 'bottom')
                                    cs(self).value('data:new-item', item, true)
                                }
                            }
                            else {
                                var idx = binarySearch(ary, item, sorting.direction, 0, ary.length - 1)
                                ary.splice(idx, 0, item)
                                if (view) {
                                    cs(self).value('state:add-pos', idx - 1)
                                    cs(self).value('data:new-item', item, true)
                                }
                            }
                        }
                        if (passed)
                            sortIn(filtered, true)
                        sortIn(unfiltered, false)
                    }
                }
            })

            cs(self).observe({
                name: 'state:sorting', spool: 'created',
                func: function (ev, sorting) {
                    var filtered = cs(self).value('data:filtered')
                    var unfiltered = cs(self).value('data:rows')
                    var asc = function (a, b) {
                        if (a[sorting.dataIndex] < b[sorting.dataIndex])
                            return -1
                        else if (a[sorting.dataIndex] > b[sorting.dataIndex])
                            return 1
                        else
                            return 0
                    }
                    var desc = function (a, b) {
                        if (a[sorting.dataIndex] < b[sorting.dataIndex])
                            return 1
                        else if (a[sorting.dataIndex] > b[sorting.dataIndex])
                            return -1
                        else
                            return 0
                    }

                    if (sorting.direction === 'asc') {
                        filtered.sort(asc)
                        unfiltered.sort(asc)
                    }
                    else {
                        filtered.sort(desc)
                        unfiltered.sort(desc)
                    }
                    cs(self).touch('data:filtered')
                    cs(self).touch('data:rows')
                }
            })

            cs(self).observe({
                name: 'data:rows', spool: 'created',
                operation: 'changed',
                func: function () {
                    cs(self).touch('state:filter')
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
                        cs(self).value('data:filtered', unfiltered.concat())
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
                if (cs(self).value('param:selectable')) {
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
                        var column = $('.thead > .row', self.grid).markup('grid/column', vars)
                        column.click(function () {
                            var current = cs(self).value('state:sorting')
                            if (current.dataIndex === col.dataIndex)
                                cs(self).value('state:sorting', { dataIndex: col.dataIndex, direction: current.direction === 'asc' ? 'desc' : 'asc' })
                            else
                                cs(self).value('state:sorting', { dataIndex: col.dataIndex, direction: 'desc' })
                        })
                    })
                }
            })

            cs(self).observe({
                name: 'state:sorting', spool: 'visible',
                touch: true,
                func: function (ev, sorting) {
                    if (!sorting)
                        return
                    var columns = cs(self).value('data:columns')
                    var idx = _.findIndex(columns, function (item) { return item.dataIndex === sorting.dataIndex })
                    $('.thead > .row > th', self.grid).removeClass('sorted')
                    $('.thead > .row > th', self.grid).eq(idx).addClass('sorted')
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
                func: function (ev, item) {
                    var action = cs(self).value('state:add-pos')
                    var row = $.markup('grid/row', { i: item.id })
                    fillRow(row, item)
                    if (action === 'top') {
                        $('.tbody', self.grid).prepend(row)
                        cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                    }
                    else if (action === 'bottom') {
                        $('.tbody', self.grid).append(row)
                        cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                    }
                    else if (action === 'remove') {
                        $('#statistics-content .tbody > .row').eq(item).remove() //item.index
                        cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') - 1)
                    }
                    else {
                        cs(self).value('state:visible-rows', cs(self).value('state:visible-rows') + 1)
                        $('#statistics-content .tbody > .row').eq(action).after(row)
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
