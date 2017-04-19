
flexiciousNmsp.FlexDataGrid.prototype.addRows = function (newRows, runFilter, runSort) {
    var bodyContainer = this.getBodyContainer();
    var rowHeight = this.getRowHeight();
    var filter = this.getRootFilter();
    var filterExpressions = filter.filterExpressions;
    var filterSorts = this.getCurrentSorts();
    var sortCompareFunction = runSort && filterSorts.length>0? this.getSortCompareFunction(filterSorts) : null;
    for (var i = 0; i < newRows.length; i++) {
        var addToCursor = true;
        var obj = newRows[i];
        var cursorIndex = Math.max(0, bodyContainer.itemVerticalPositions.length);
        this._dataProvider.push(obj);
        if (runFilter && filterExpressions.length > 0) {
            for (var k = 0; k < filterExpressions.length; k++) {
                var fExp = filterExpressions[k];
                if (!fExp.isMatch(obj)) {
                    addToCursor = false;
                    break;
                }
            }
        }
        if (addToCursor) {
            if (sortCompareFunction) {
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
    var resolveExpression = function(obj, expr){
        if(expr.indexOf(".") ==-1){
            return obj[expr]
        }
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
$(document).ready(function () {

    var gridXml = '<grid  id="grid"  enableFooters="true" enableFilters="true"   enableExport="true" preferencePersistenceKey="programaticCellFormatting" forcePagerRow="true">' +
        '			<level  selectedKeyField="id" >' +
        '				<columns>' +
        '					<column type="checkbox" />' +
        '					<column dataField="id" headerText="ID" filterControl="TextInput"/>' +
        '					<column dataField="legalName" headerText="Legal Name"/>' +
        '					<column dataField="line1" headerText="Address Line 1" footerLabel="Count:" footerOperation="count"/>' +
        '					<column dataField="line2" headerText="Address Line 2"/>' +
        '					<column dataField="city" headerText="City" filterControl="MultiSelectComboBox"   filterComboBoxBuildFromGrid="true" filterComboBoxwidth="100"/>' +
        '					<column dataField="state" headerText="State" filterControl="MultiSelectComboBox" filterComboBoxBuildFromGrid="true" filterComboBoxwidth="100"/>' +
        '					<column width="100" columnWidthMode="fixed"  dataField="annualRevenue" headerText="Annual Revenue" textAlign="right" headerAlign="center"   footerAlign="center" footerFormatter="flexiciousNmsp.CurrencyFormatter" labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="100"  columnWidthMode="fixed" dataField="numEmployees" headerText="Num Employees" textAlign="right"  footerFormatter="flexiciousNmsp.CurrencyFormatter" labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="100" columnWidthMode="fixed" dataField="earningsPerShare" headerText="EPS" textAlign="right"  footerFormatter="flexiciousNmsp.CurrencyFormatter"  labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="100" columnWidthMode="fixed" dataField="lastStockPrice" headerText="Stock Price"  textAlign="right"  footerFormatter="flexiciousNmsp.CurrencyFormatter" labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '				</columns>' +
        '			</level>' +
        '	</grid>';


    grid = new flexiciousNmsp.FlexDataGrid(document.getElementById("gridContainer"),
        {
            dataProvider: generateData(500),
            configuration: gridXml

        });

})

var timeSpentFiltering = 0;
var timeSpentSorting = 0;
var timeSpentRedering = 0;


var grid;
var maxRecords = 15000;
var currentIntervalId = -1;
var idx = 0;
var cities = ['Grand Rapids',
    'Albany',
    'Stroudsburgh',
    'Barrie',
    'Springfield'];
var states =
    ['Michigan',
        'New York',
        'Penn',
        'New Jersey',
        'Ohio',
        'North Carolina'];
var streetNames = ['Park', 'West', 'Newark', 'King', 'Gardner'];
var streetTypes = ['Ave', 'Blvd', 'Rd', 'St', 'Lane'];
function getRandom(minNum, maxNum) {
    return Math.ceil(Math.random() * (maxNum - minNum + 1)) + (minNum - 1);
};
function startTimer() {
    document.getElementById("cbFilterRows").disabled = true;
    document.getElementById("cbSortRows").disabled = true;
    document.getElementById("btnFetch").disabled = true;
    currentIntervalId = setInterval(function () {
        if (grid._dataProvider.length >= maxRecords) {
            clearInterval(currentIntervalId);
            return;
        }
        grid.addRows(generateData(500), document.getElementById("cbFilterRows").checked, document.getElementById("cbSortRows").checked)
    }, 1000)
}
function generateData(count) {
    var result = [];
    for (var i = 0; i < count; i++) {
        var obj = {};
        obj.id = idx++;
        obj.legalName = "Name " + obj.id;
        obj.line1 = getRandom(100, 999).toString() + " " + streetNames[getRandom(0, streetNames.length - 1)] + " " + streetTypes[getRandom(0, streetTypes.length - 1)];
        obj.line2 = "Suite #" + getRandom(1, 1000);
        obj.city = cities[getRandom(0, cities.length - 1)];
        obj.state = states[getRandom(0, states.length - 1)];

        obj.annualRevenue = getRandom(1000, 60000)
        obj.numEmployees = getRandom(1000, 60000)
        obj.earningsPerShare = getRandom(1, 6) + (getRandom(1, 99) / 100);
        obj.lastStockPrice = getRandom(10, 30) + (getRandom(1, 99) / 100);

        result.push(obj);
    }
    return result;
}