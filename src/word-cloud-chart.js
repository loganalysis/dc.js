/**
## Word Cloud Chart

Includes: [Color Mixin](#color-mixin), [Base Mixin](#base-mixin)

This will create a simple word cloud on which you can add color. This is simply a list
of words and the words are not rotated.

#### Example of usage

```js
var chart = dc.wordCloudChart()
    .width(500)
    .dimension(states)
    .group(stateRaisedSum)
    .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
    .colorDomain([0, 200])
    .colorCalculator(function (d) { return d ? wcChart.colors()(d) : '#ccc'; })
    .label(function (d) { return labels[d.key]; })
    .title(function (d) { return d.value+" $"; })
    .callbackRollUp(function () { console.log("rolled up"); })
    .callbackDrillDown(function (d) { console.log("drilled down on "+d); });
```


#### dc.wordCloudChart(parent[, chartGroup])
Create a word cloud instance and attach it to the given parent element.

Parameters:

* parent : string - any valid d3 single selector representing typically a dom block element such
   as a div.
* chartGroup : string (optional) - name of the chart group this chart instance should be placed in. Once a chart is placed
   in a certain chart group then any interaction with such instance will only trigger events and redraw within the same
   chart group.

Return:
A newly created word cloud instance

```js
// create a pie chart under #chart-container1 element using the default global chart group
var chart1 = dc.pieChart("#chart-container1");
// create a pie chart under #chart-container2 element using chart group A
var chart2 = dc.pieChart("#chart-container2", "chartGroupA");
```

**/
dc.wordCloudChart = function (parent, chartGroup) {
    var _chart = dc.colorMixin(dc.baseMixin({}));

    var MIN_SIZE = 11;
    var MAX_SIZE = 30;

    var min;
    var max;

    /**
     * Render the word cloud
     */
    _chart._doRender = function () {

        min = _chart.group().order(function(d) { return -d; }).top(1)[0].value;
        max = _chart.group().orderNatural()                   .top(1)[0].value;

        _chart.selectAll("div").remove();
        _chart.root()
            .style("width", _chart.width()+"px")
            .selectAll("div")
            .data(_chart.data())
            .enter()
            .append('div')
            .attr("class", function (d) {
                var selectClass = "";
                if (isSelected(d.key)) { selectClass = " selected" };
                if (isDeselected(d.key)) { selectClass = " deselected" };
                return "dc-word" + selectClass;
            })
            .style("font-size", function (d) { return getSize(d.value)+"px"; })
            .style("color", function (d, i) { return _chart.getColor(d.value, i); })
            .html(function(d) {
                return _chart.label()(d);
            })
            .attr("title", renderTitle)
            .on("click", onClick)
            .on("mousewheel", onMouseWheel)
            .on("DOMMouseScroll",  onMouseWheel) // older versions of Firefox
            .on("wheel",  onMouseWheel); // newer versions of Firefox

        _chart.root().append("div").attr("class", "dc-word-clear");
    };

    /**
     * Return the size of a word in px based on the input value.
     * 
     * @private
     * @param {float} d - value
     * @return {flat} size in px
     */
    function getSize(d) {
        return  (d - min)    *  (MAX_SIZE - MIN_SIZE) / (max - min) + MIN_SIZE;
        //  back to 0 origin               change extent           add new offset
    }

    /**
     * Function called when clicking on a word
     */
    function onClick (d) {
        _chart.onClick(d);
        _chart.redrawGroup();
    }
    
    /**
     * Indicate if a given element (key) is selected
     */
    function isSelected(d) {
        return _chart.hasFilter() && _chart.hasFilter(d);
    }

    /**
     * Indicate if a given element (key) is deselected
     */
    function isDeselected(d) {
        return _chart.hasFilter() && !_chart.hasFilter(d);
    }

    /**
     * Return the title related to a datum
     */
    function renderTitle(d) {
        if (_chart.renderTitle()) {
            return _chart.title()(d);
        }

        return "";
    }

    /**
     * Redraw the chart
     */
    _chart._doRedraw = function () {
        _chart._doRender();
    };

    /**
     * Function called when using mouse wheel on a word. Will triger callbacks if needed
     */
    function onMouseWheel (d) {

        var drillDown;
        var rollUp;

        if (drillDown == undefined)
            drillDown = true;
        if (rollUp == undefined)
            rollUp = true;

        // drill down if zoom-in
        if ((d3.event.deltaY < 0 || d3.event.wheelDeltaY > 0) && _chart.callbackDrillDown() !== null) {
            if (!_chart._disabledActions.allMouseWheel) {
                _chart._delayAction('allMouseWheel', 3000);
                _chart.callbackDrillDown()(d);
            }
        }
        // roll up if zoom-out
        else if ((d3.event.deltaY > 0 || d3.event.wheelDeltaY < 0) && _chart.callbackRollUp() !== null) {
            if (!_chart._disabledActions.allMouseWheel) {
                _chart._delayAction('allMouseWheel', 3000);
                _chart.callbackRollUp()();
            }
        }
        
        // prevent scrolling on page
        d3.event.preventDefault();
        return false;
    }

    /**
     * These 3 elements below allow to disable roll-up and drill-down during a certain time.
     * It is necessary because the mousewheel call the function several time successively.
     */
    _chart._disabledActions = {
        allMouseWheel : false,
    };

    _chart._delayAction = function (name, delay) {
        _chart._disabledActions[name] = true;
        d3.timer(function () { _chart._enableAction(name); return true; }, delay);
    };

    _chart._enableAction = function (name) {
        _chart._disabledActions[name] = false;
    };


    /**
    #### .callbackDrillDown([callback])
    Set or get the current callback function on drill down.

    If `callback` is `null`, removes the callback.
    **/
    _chart.callbackDrillDown = function (callback) {
        if (!arguments.length) {
            if (_chart._callbackDrillDown !== undefined)
                return _chart._callbackDrillDown;
            else
                return null;
        }
        
        if (callback === null) _chart._callbackDrillDown = undefined;
        else _chart._callbackDrillDown = callback;
        
        return _chart;
    };

    /**
    #### .callbackRollUp([callback])
    Set or get the current callback function on roll up.

    If `callback` is `null`, removes the callback.
    **/
    _chart.callbackRollUp = function (callback) {
        if (!arguments.length) {
            if (_chart._callbackRollUp !== undefined)
                return _chart._callbackRollUp;
            else
                return null;
        }

        if (callback === null) _chart._callbackRollUp = undefined;
        else _chart._callbackRollUp = callback;
        
        return _chart;
    };


    return _chart.anchor(parent, chartGroup);
};
