/**
 * Applies the given attribute to the target. Has built in logic to check to
 * see if the property is a getter or a setter or a public field, or an event listener,
 * or a factory, or a renderer. If there is a factory or a renderer, we try to evaluate
 * the actual function on basis of the string passed in.
 * @method applyAttribute
 * @param target The target to apply the property to
 * @param attr  The attribute on the target
 * @param node  The value to apply
 */
flexiciousNmsp.FlexDataGrid.prototype.applyAttribute = function (target, attr, node, direct) {
    var uiUtil = flexiciousNmsp.UIUtils;
    var targetEvents = flexiciousNmsp[target.typeName].ALL_EVENTS;
    if (!targetEvents) {
        flexiciousNmsp[target.typeName].ALL_EVENTS = [];
        for (var prop in flexiciousNmsp[target.typeName]) {
            if (prop.indexOf("EVENT_") == 0) {
                flexiciousNmsp[target.typeName].ALL_EVENTS.push(flexiciousNmsp[target.typeName][prop]);
            }
        }
        targetEvents = flexiciousNmsp[target.typeName].ALL_EVENTS;
    }
    //try
    {
        var attrName = direct ? attr : attr.name;
        var val = direct ? node : node.attributes.getNamedItem(attrName).value;

        if (this.delegate && val && val["length"] && val[0] == "{" && val[val.length - 1] == "}") {
            val = val.replace(/{/, "").replace(/}/, "");
            val = val.replace(/\(/, ",").replace(/\)/, "");
            val = val.split(",");
            val = this.executeFunctionByName(val.shift(), this.delegate, val);
        }
        //in here, values could be class factories or functions, which
        //need additional processing before we can apply them.
        if (attrName.indexOf('Function') > 0 || attrName.indexOf('Renderer') > 0 || attrName.indexOf('Editor') > 0
            || attrName.indexOf('spinnerFactory') >= 0
            || attrName.indexOf('filterDateRangeOptions') >= 0 || attrName.indexOf("Formatter") > 0
            || attrName.indexOf("on") == 0 || targetEvents.indexOf(attrName) >= 0) {

            if (this.delegate != null && this.delegate[val] != undefined) {
                val = this.delegate[val];
            }
            else {
                val = eval(val);
            }

            if (attrName.indexOf("on") == 0 || targetEvents.indexOf(attrName) >= 0) {
                //this is an event
                target.addEventListener(this, attrName.indexOf("on") == 0 ? attrName.substring(2) : attrName, val);
            } else if (attrName == ('filterRenderer') ||
                attrName == ('footerRenderer') ||
                attrName == ('headerRenderer') ||
                attrName == ('pagerRenderer') ||
                attrName == ('itemRenderer') ||
                attrName == ('nextLevelRenderer') ||
                attrName == ('iconTooltipRenderer') ||
                attrName == ('spinnerFactory') ||
                attrName == ('itemEditor') ||
                attrName == ('popupFactoryExportOptions') ||
                attrName == ('popupFactorySaveSettingsPopup') ||
                attrName == ('popupFactorySettingsPopup')
            ) {
                if (!val.implementsOrExtends || !val.implementsOrExtends('ClassFactory')) {
                    val = new flexiciousNmsp.ClassFactory(val);
                }
            }
        }
        else if (Array.isArray(val)) {
        }
        else if (typeof val !== "string") {
        }
        else if (val.toString() == {}.toString()) {

        }
        else if (val.toLowerCase() == "false") {
            val = false;
        }
        else if (val.toLowerCase() == "true") {
            val = true;
        }
        else if (val.indexOf("[") == 0) {
            val = val.substring(1, val.length - 1).split(",");
            for (var i = 0; i < val.length; i++) {
                if (val[i].indexOf("0x") == 0) {
                    val[i] = parseInt(val[i], 16);
                }
            }
        }
        else if (val.indexOf("0x") == 0) {
            val = parseInt(val, 16)
        }
        else if ((val.indexOf("eval__") == 0)) {
            val = eval(val.split("eval__")[1])
        }
        else if (uiUtil.isStringNumeric(val)) {
            val = parseFloat(val)
        }

        this.checkSetterAndApply(target, attrName, val);
    }

};


/**
 * used by the buildFromXml method to parse the XML to build the grid
 * @method parse
 */
flexiciousNmsp.FlexDataGrid.prototype.buildFromJson = function (config) {
    for (var key in config) {
        if (key == "level") {
            this.extractLevelFromJson(config[key], this.getColumnLevel());
        } else {
            this.applyAttribute(this, key, config[key], true);
        }
    }
}

/**
 * Method to extact column information from JSON
 * @method extractColumns
 */
flexiciousNmsp.FlexDataGrid.prototype.extractColumnsFromJson = function (config, lvl) {
    var cols = [];
    var hasColumnGroups = false;
    for (var j = 0; j < config.length; j++) {
        var colNode = config[j];
        if (colNode.type == "columnGroup") {
            hasColumnGroups = true;
            cols.push(this.extractColGroupFromJson(colNode));
        }
        else
            cols.push(this.extractColFromJson(colNode));
    }
    if (hasColumnGroups)
        lvl.setGroupedColumns(cols);
    else
        lvl.setColumns(cols);
    return { cols: cols, hasColumnGroups: hasColumnGroups, j: j, colNode: colNode };
};
/**
 * Method to extract level information from JSON
 * @method extractLevelFromJson
 */

flexiciousNmsp.FlexDataGrid.prototype.extractLevelFromJson = function (config, lvl) {
    for (var key in config) {
        if (key == "columns") {
            this.extractColumnsFromJson(config[key], lvl);
        }
        else if (key == "nextLevel") {
            lvl.nextLevel = new flexiciousNmsp.FlexDataGridColumnLevel(lvl.grid);
            this.extractLevelFromJson(config[key], lvl.nextLevel);
        } else {
            this.applyAttribute(lvl, key, config[key], true);
        }
    }
};
/**
 * @method extractColGroup
 */
flexiciousNmsp.FlexDataGrid.prototype.extractColGroupFromJson = function (config) {

    var cg = new flexiciousNmsp.FlexDataGridColumnGroup();
    var cols = [];
    var hasColumnGroups = false;
    for (var key in config) {
        if (key == "columns") {
            for (var i = 0; i < config[key].length; i++) {
                var colNode = config[key][i];
                cols.push(this.extractColFromJson(colNode));
            }
        }
        if (key == "columnGroup") {
            hasColumnGroups = true;
            cols.push(this.extractColGroup(colNode));
        } else {
            this.applyAttribute(cg, key, config[key], true);

        }
    }
    if (hasColumnGroups)
        cg.columnGroups = (cols);
    else
        cg.setColumns(cols);
    return cg;
};

/**
 * @method extractCol
 */
flexiciousNmsp.FlexDataGrid.prototype.extractColFromJson = function (config) {
    var col = new flexiciousNmsp.FlexDataGridColumn();
    if (config.type == "checkbox")
        col = new flexiciousNmsp.FlexDataGridCheckBoxColumn();

    for (var key in config) {
        var colAttr = config[key];
        if (key != "type")
            this.applyAttribute(col, key, config[key], true);
    }
    return col;
};


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
    if (bodyContainer.rows.length == 0) {
        //we havent drawn anything yet.
        bodyContainer.drawRows(true)
        this.checkNoDataMessage();
    } else {
        for (var j = 0; j < bodyContainer.rows.length; j++) {
            var row = bodyContainer.rows[j];
            //now go through all the drawn rows, and update their y property
            row.setY(row.rowPositionInfo.verticalPosition);
        }

        bodyContainer.recycle(this.getColumnLevel(), false, this.rowHeight, false);//now make sure the body draws the row
        bodyContainer.placeComponents();//update the cell positions
        bodyContainer.invalidateCells();
        bodyContainer.checkScrollChange()
        bodyContainer.vMatch.setHeight(bodyContainer._calculatedTotalHeight);
    }
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
