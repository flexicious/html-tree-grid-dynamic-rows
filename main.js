
$(document).ready(function () {
    var gridXml = '<grid  id="grid"  enableFooters="true" enableFilters="true"   enableExport="true" preferencePersistenceKey="programaticCellFormatting" forcePagerRow="true">' +
        '			<level  selectedKeyField="id" >' +
        '				<columns>' +
        '					<column type="checkbox" />' +
        '					<column dataField="id" headerText="ID" filterControl="TextInput" filterOperation="BeginsWith"/>' +
        '					<column dataField="legalName" filterControl="TextInput" filterOperation="BeginsWith" headerText="Legal Name"/>' +
        '					<column dataField="line1" filterControl="TextInput" filterOperation="BeginsWith" headerText="Address Line 1"  footerLabelFunction="getFooter"/>' +
        '					<column dataField="line2" filterControl="TextInput" filterOperation="BeginsWith" headerText="Address Line 2"/>' +
        '					<column dataField="city" headerText="City" filterControl="MultiSelectComboBox"   filterComboBoxBuildFromGrid="true" filterComboBoxwidth="100"/>' +
        '					<column dataField="state" headerText="State" filterControl="MultiSelectComboBox" filterComboBoxBuildFromGrid="true" filterComboBoxwidth="100"/>' +
        '					<column width="100" columnWidthMode="fixed"  dataField="annualRevenue" headerText="Annual Revenue" textAlign="right" headerAlign="center"  labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="100"  columnWidthMode="fixed" dataField="numEmployees" headerText="Num Employees" textAlign="right"  footerFormatter="flexiciousNmsp.CurrencyFormatter" labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="100" columnWidthMode="fixed" dataField="earningsPerShare" headerText="EPS" textAlign="right"  footerFormatter="flexiciousNmsp.CurrencyFormatter"  labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="100" columnWidthMode="fixed" dataField="lastStockPrice" headerText="Stock Price"  textAlign="right"  footerFormatter="flexiciousNmsp.CurrencyFormatter" labelFunction="flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction"/>' +
        '					<column width="40" dataField="type1" filterControl="ComboBox" filterComboBoxBuildFromGrid="true" columnWidthMode="fixed" itemRenderer="flexiciousNmsp.FontAwesomeRenderer"/>' +
        '				</columns>' +
        '			</level>' +
        '	</grid>';

    var gridJson = {
        id: "grid",
        enableFooters: true, enableFilters: true, enableExport: true,
        preferencePersistenceKey: "programaticCellFormatting", forcePagerRow: true,
        level: {
            selectedKeyField: "id",
            columns: [
                { type: "checkbox" },
                { dataField: "id", headerText: "ID", filterControl: "TextInput", filterOperation: "BeginsWith" },
                { dataField: "legalName", filterControl: "TextInput", filterOperation: "BeginsWith", headerText: "Legal Name" },
                { dataField: "line1", filterControl: "TextInput", filterOperation: "BeginsWith", headerText: "Address Line 1", footerLabelFunction: "getFooter" },
                { dataField: "line2", filterControl: "TextInput", filterOperation: "BeginsWith", headerText: "Address Line 2" },
                { dataField: "city", headerText: "City", filterControl: "MultiSelectComboBox", filterComboBoxBuildFromGrid: true, filterComboBoxwidth: "100" },
                { dataField: "state", headerText: "State", filterControl: "MultiSelectComboBox", filterComboBoxBuildFromGrid: true, filterComboBoxwidth: "100" },
                {
                    width: "100", columnWidthMode: "fixed", dataField: "annualRevenue", headerText: "Annual Revenue", textAlign: "right", headerAlign: "center",
                    labelFunction: flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction
                },
                {
                    width: "100", columnWidthMode: "fixed", dataField: "numEmployees", headerText: "Num Employees",
                    textAlign: "right", footerFormatter: flexiciousNmsp.CurrencyFormatter,
                    labelFunction: flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction
                },
                {
                    width: "100", columnWidthMode: "fixed", dataField: "earningsPerShare", headerText: "EPS", textAlign: "right",
                    footerFormatter: flexiciousNmsp.CurrencyFormatter, labelFunction: flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction
                },
                {
                    width: "100", columnWidthMode: "fixed", dataField: "lastStockPrice", headerText: "Stock Price", textAlign: "right",
                    footerFormatter: flexiciousNmsp.CurrencyFormatter, labelFunction: flexiciousNmsp.UIUtils.dataGridFormatCurrencyLabelFunction
                },
                {
                    width: "40", dataField: "type1", filterControl: "ComboBox", filterComboBoxBuildFromGrid: true, columnWidthMode: "fixed",
                    itemRenderer: flexiciousNmsp.FontAwesomeRenderer
                },

            ]
        }
    }

    grid = new flexiciousNmsp.FlexDataGrid(document.getElementById("gridContainer"),
        {
            dataProvider: generateData(500)
            ,configuration : gridXml
        });
grid.setDimensions(800,600)
    //grid.buildFromJson(gridJson);
})
var getFooter = function (col) {
    var level = col.level;
    var grid = level.grid;
    return "Total : " + grid.getBodyContainer().itemVerticalPositions.length;
}
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
    document.getElementById("cbUpdateDataProvider").disabled = true;
    document.getElementById("cbFilterRows").disabled = true;
    document.getElementById("cbSortRows").disabled = true;
    document.getElementById("btnFetch").disabled = true;
    currentIntervalId = setInterval(function () {
        document.getElementById("btnFetch").innerHTML = grid._dataProvider.length + " records loaded";
        if (grid._dataProvider.length >= maxRecords) {
            clearInterval(currentIntervalId);
            return;
        }
        grid.processDelta('add', generateData(500), document.getElementById("cbFilterRows").checked, document.getElementById("cbSortRows").checked, document.getElementById("cbUpdateDataProvider").checked)
        console.log(grid._dataProvider.length + " records loaded")
    }, 250)
}

function deleteItemsRandom() {
    grid.processDelta('remove', getRandomData(5), document.getElementById("cbFilterRows").checked, document.getElementById("cbSortRows").checked, document.getElementById("cbUpdateDataProvider").checked);
}

function updateItemsRandom() {
    grid.processDelta('update', getRandomData(5, true), document.getElementById("cbFilterRows").checked, document.getElementById("cbSortRows").checked);
}

function getRandomData(count, update) {
    if(typeof update === 'undefined') update = false;
    var list = [], data = grid.getDataProvider();
    for(var i=0;i<count;i++) {
        var rIdx = Number(Math.floor((Math.random() * Math.pow(10, String(grid.getDataProvider().length).length - 1) + 1).toFixed(0)));
        if( update )
            data[rIdx].legalName += ' (Modified)';
        list.push(data[rIdx]);
    }
    return list;
}

/*
 * Resets form, loads a new first 500 records  */
function simDataSwitch() {
    document.getElementById("cbUpdateDataProvider").disabled = false;
    document.getElementById("cbFilterRows").disabled = false;
    document.getElementById("cbSortRows").disabled = false;
    document.getElementById("btnFetch").disabled = false;
    document.getElementById("btnFetch").innerHTML = "Start Fetching data";
    idx = 0;
    grid.setDataProvider(generateData(500));
}

function generateData(count) {
    var result = [];
    for (var i = 0; i < count; i++) {
        var obj = {};
        obj.id = idx++;
        obj.legalName = "Name " + obj.id;
        obj.line1 = getRandom(100, 999).toString() + " " + streetNames[getRandom(0, streetNames.length - 1)] + " " + streetTypes[getRandom(0, streetTypes.length - 1)];
        obj.line2 = "Suite #" + getRandom(1, 1000);

        // 1 in 750 chance of getting a special record in the line2 field, easy to filter on.
        if (getRandom(0, 750) == 0) {
            obj.line2 = 'TEST'
        }

        if (i % 5 == 0) {
            obj.line2 = null;
        }
        obj.city = cities[getRandom(0, cities.length - 1)];
        obj.state = states[getRandom(0, states.length - 1)];

        obj.annualRevenue = getRandom(1000, 60000)
        obj.numEmployees = getRandom(1000, 60000)
        obj.earningsPerShare = getRandom(1, 6) + (getRandom(1, 99) / 100);
        obj.lastStockPrice = getRandom(10, 30) + (getRandom(1, 99) / 100);
        obj.type1 = parseInt(Math.random() * 10).toString()

        result.push(obj);
    }
    return result;
}





/**
 * Flexicious
 * Copyright 2011, Flexicious LLC
 */
(function (window) {
    "use strict";
    var FontAwesomeRenderer, uiUtil = flexiciousNmsp.UIUtils, flxConstants = flexiciousNmsp.Constants;
    /**
     * A FontAwesomeRenderer is a custom item renderer, that defines how to use custom cells with logic that you can control
     * @constructor
     * @namespace com.flexicious.controls
     * @extends UIComponent
     */
    FontAwesomeRenderer = function () {
        //make sure to call constructor
        flexiciousNmsp.UIComponent.apply(this, ["span"]);//second parameter is the tag name for the dom element.

        this.background = document.createElement("i");
        this.icon = document.createElement("i");
        this.className = "fa-stack fa-2x";

        this.background.className = "fa fa-circle fa-stack-2x";
        this.icon.className = "fa fa-lock fa-stack-1x";

        this.addChild(this.background);
        this.addChild(this.icon);
        /**
         * This is a getter/setter for the data property. When the cell is created, it belongs to a row
         * The data property points to the item in the grids dataprovider that is being rendered by this cell.
         * @type {*}
         */
        this.data = null;
        //the add event listener will basically proxy all DomEvents to your code to handle.
        //this.addEventListener(this, flxConstants.EVENT_CLICK, this.onClick);
    };
    flexiciousNmsp.FontAwesomeRenderer = FontAwesomeRenderer; //add to name space
    FontAwesomeRenderer.prototype = new flexiciousNmsp.UIComponent(); //setup hierarchy
    FontAwesomeRenderer.prototype.typeName = FontAwesomeRenderer.typeName = 'FontAwesomeRenderer';//for quick inspection
    FontAwesomeRenderer.prototype.getClassNames = function () {
        return ["FontAwesomeRenderer", "UIComponent"]; //this is a mechanism to replicate the "is" and "as" keywords of most other OO programming languages
    };

    FontAwesomeRenderer.prototype.setWidth = function (w) {
        flexiciousNmsp.UIComponent.prototype.setWidth.apply(this, [w]);
    }
    /**
     * This is important, because the grid looks for a "setData" method on the renderer.
     * In here, we intercept the call to setData, and inject our logic to populate the text input.
     * @param val
     */
    FontAwesomeRenderer.prototype.setData = function (val) {
        this.data = val;
        var cell = this.parent; //this is an instance of FlexDataGridDataCell (For data rows)
        var column = cell.getColumn();//this is an instance of FlexDataGridColumn.
        if (this.attachedClass) {
            this.background.classList.remove(this.attachedClass);
        }
        this.attachedClass = "icon-background" + val[column.getDataField()];
        this.background.classList.add(this.attachedClass);
    };
    /**
     * This event is dispatched when the user clicks on the icon. The event is actually a flexicious event, and has a trigger event
     * property that points back to the original domEvent.
     * @param event
     */
    FontAwesomeRenderer.prototype.onClick = function (evt) {
        this.toggle();

    }
    FontAwesomeRenderer.prototype.toggle = function () {
        var val = this.data;
        var cell = this.parent; //this is an instance of FlexDataGridDataCell (For data rows)
        var column = cell.getColumn();//this is an instance of FlexDataGridColumn.
        val[column.getDataField()] = !val[column.getDataField()];
        this.img.src = val[column.getDataField()] ? checkBox : uncheckBox;
        cell.rowInfo.refreshCells();//this will re-render the cells.
    }
    //This sets  the inner html, and grid will try to set it. Since we are an input field, IE 8 will complain. So we ignore it since we dont need it anyway.
    FontAwesomeRenderer.prototype.setText = function (val) {

    };

} (window));

