
flexiciousNmsp.FlexDataGrid.prototype.addRows = function (newRows, runFilter, runSort) {
    var bodyContainer = this.getBodyContainer();
    var rowHeight = this.getRowHeight();
    var filter = this.getRootFilter();
    var filterExpressions = filter.filterExpressions;
    var filterSorts = this.getCurrentSorts();
    var sortCompareFunction = runSort && filterSorts.length > 0 ? this.getSortCompareFunction(filterSorts) : null;
    for (var i = 0; i < newRows.length; i++) {
        var addToCursor = true;
        var obj = newRows[i];
        var cursorIndex = Math.max(0, bodyContainer.itemVerticalPositions.length);
        this._dataProvider.push(obj);
        if (runFilter && filterExpressions.length > 0) {
            for (var k = 0; k < filterExpressions.length; k++) {
                var fExp = filterExpressions[k];
                if (!fExp.isMatch(obj, this)) {
                    addToCursor = false;
                    break;
                }
            }
        }
        if (addToCursor) {
            if (sortCompareFunction && bodyContainer.itemVerticalPositions.length > 0) {
                cursorIndex = this.getIndexForElement(bodyContainer.itemVerticalPositions, obj, sortCompareFunction).index;
            }
            var referenceRowPosition = cursorIndex > 0 ? bodyContainer.itemVerticalPositions[cursorIndex - 1] : null;
            var rowPos = new flexiciousNmsp.RowPositionInfo(
                obj,//the data object
                referenceRowPosition ? referenceRowPosition.rowIndex + 1 : 0, //row index of the data object (0 because we are adding it at the top, you can add it anywhere
                referenceRowPosition ? referenceRowPosition.verticalPosition + rowHeight : 0,//vertical position of the data object (rowIndex * rowHeight) assuming no variable row height. Or you could lookup the verticalPos of the item above me, and add his height to that number to get this number
                rowHeight,//same height rows. For variable row height, you can calculate this
                this.getColumnLevel(), //the top level. If you are adding a child object, you can use the appropriate inner level
                flexiciousNmsp.RowPositionInfo.ROW_TYPE_DATA //type of row. For inner level rows, you can add Header, footer, filter, pager ,renderer rows
            );
            for (var j = cursorIndex; j < bodyContainer.itemVerticalPositions.length; j++) {
                var existingRowPos = bodyContainer.itemVerticalPositions[j];
                existingRowPos.rowIndex += 1;
                existingRowPos.verticalPosition += rowHeight;//push everything down.
            }
            bodyContainer._calculatedTotalHeight += rowHeight;
            bodyContainer.itemVerticalPositions.splice(cursorIndex, 0, rowPos);//add item at index 0.
        }
    }

    for (var j = 0; j < bodyContainer.rows.length; j++) {
        var row = bodyContainer.rows[j];
        //now go through all the drawn rows, and update their y property
        row.setY(row.rowPositionInfo.verticalPosition);
    }
    bodyContainer.recycle(this.getColumnLevel(), false, this._rowHeight, false);//now make sure the body draws the row
    bodyContainer.placeComponents();//update the cell positions
    bodyContainer.invalidateCells();
    bodyContainer.checkScrollChange()
    bodyContainer.vMatch.setHeight(bodyContainer._calculatedTotalHeight);
    this.getFooterContainer().refreshCells();
}

flexiciousNmsp.FlexDataGrid.prototype.getIndexForElement = function (array, searchElement, sortCompareFunction) {
    var minIndex = 0;
    var maxIndex = array.length - 1;
    var currentIndex;
    var currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = array[currentIndex].rowData;
        var sortCompareResult = sortCompareFunction(currentElement, searchElement);
        if (sortCompareResult < 0) {
            minIndex = currentIndex + 1;
        }
        else if (sortCompareResult > 0) {
            maxIndex = currentIndex - 1;
        }
        else {
            return { // Modification
                found: true,
                index: currentIndex
            };
        }
    }
    return { // Modification
        found: false,
        index: sortCompareResult < 0 ? currentIndex + 1 : currentIndex
    };
}

flexiciousNmsp.FlexDataGrid.prototype.getSortCompareFunction = function (sorts) {
    var UIUtils = flexiciousNmsp.UIUtils;
    var funcs = [];
    var resolveExpression = function (obj, expr) {
        return UIUtils.resolveExpression(obj, expr);
    }
    for (var i = 0; i < sorts.length; i++) {
        var srt = sorts[i];
        if (srt.sortColumn || srt.sortCompareFunction != null) {

            if (srt.sortCompareFunction != null) {
                funcs.push(srt.sortCompareFunction)
            }
            else if (srt.sortCaseInsensitive) {
                funcs.push(srt.isAscending ? function (a, b, srt) {
                    var aVal = (UIUtils.toString(resolveExpression(a, srt.sortColumn))).toLowerCase();
                    var bVal = (UIUtils.toString(resolveExpression(b, srt.sortColumn))).toLowerCase();
                    if (aVal < bVal)
                        return -1;
                    if (aVal > bVal)
                        return 1;
                    return 0;
                } :
                    function (a, b, srt) {
                        var aVal = (UIUtils.toString(resolveExpression(a, srt.sortColumn))).toLowerCase();
                        var bVal = (UIUtils.toString(resolveExpression(b, srt.sortColumn))).toLowerCase();
                        if (aVal > bVal)
                            return -1;
                        if (aVal < bVal)
                            return 1;
                        return 0;
                    });
            } else if (srt.sortNumeric) {
                funcs.push(srt.isAscending ? function (a, b, srt) {
                    var aVal = parseFloat(resolveExpression(a, srt.sortColumn));
                    var bVal = parseFloat(resolveExpression(b, srt.sortColumn));
                    if (aVal < bVal)
                        return -1;
                    if (aVal > bVal)
                        return 1;
                    return 0;
                } :
                    function (a, b, srt) {
                        var aVal = parseFloat(resolveExpression(a, srt.sortColumn));
                        var bVal = parseFloat(resolveExpression(b, srt.sortColumn));
                        if (aVal > bVal)
                            return -1;
                        if (aVal < bVal)
                            return 1;
                        return 0;
                    });
            }
            else {
                funcs.push(
                    srt.isAscending ? function (a, b, srt) {
                        var aVal = (resolveExpression(a, srt.sortColumn));
                        var bVal = (resolveExpression(b, srt.sortColumn));
                        if (aVal < bVal)
                            return -1;
                        if (aVal > bVal)
                            return 1;
                        return 0;
                    } :
                        function (a, b, srt) {
                            var aVal = (resolveExpression(a, srt.sortColumn));
                            var bVal = (resolveExpression(b, srt.sortColumn));
                            if (aVal > bVal)
                                return -1;
                            if (aVal < bVal)
                                return 1;
                            return 0;
                        }
                );
            }
        }
    }
    var finalFunc = function (a, b) {
        for (var j = 0; j < funcs.length; j++) {
            //for (var i=funcs.length-1;i>=0;i--){
            var result = sorts[j].sortCompareFunction ? sorts[j].isAscending ? funcs[j](a, b, sorts[j]) : funcs[j](b, a, sorts[j]) : funcs[j](a, b, sorts[j]);
            if (result != 0) {
                return result;
            }
        }
        return 0;
    };
    return finalFunc;
}

/**
 * Refreshing the contents of this cell.
 */
flexiciousNmsp.FlexDataGridFooterCell.prototype.refreshCell = function () {

    flexiciousNmsp.FlexDataGridCell.prototype.refreshCell.apply(this, []);
    var col = this.getColumn();
    if (this.getColumn() && (col.footerLabelFunction != null || col.footerLabelFunction2 != null || col.footerOperation != null || col.footerLabel != null)) {

        if (this.level.getNestDepth() == 1)
            this.calculateValue((col.footerLabelFunction != null || col.footerLabelFunction2 != null) ? [] : uiUtil.filterArray(this.level.grid.getRootFlat(), this.level.grid.getRootFilter(), this.level.grid, this.level, false));
        else
            this.calculateValue(this.level.getParentLevel().getChildren(this.rowInfo.getData(), true, false, true))
    }
    else {
        this.setText("");
    }

};