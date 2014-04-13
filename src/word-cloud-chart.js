/**
## Word Cloud Chart

Includes: [Color Mixin](#color-mixin), [Base Mixin](#base-mixin), [Wheel Mixin](#wheel-mixin)

This will create a simple word cloud on which you can add color. This is simply a list
of words and the words are not rotated.

#### Example of usage

```js
var chart = dc.wordCloudChart()
    .dimension(states)
    .group(stateRaisedSum)
    .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
    .colorDomain([0, 200])
    .colorCalculator(function (d) { return d ? wcChart.colors()(d) : '#ccc'; })
    .label(function (d) { return labels[d.key]; })
    .title(function (d) { return d.value+" $"; })
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
var chart1 = dc.wordCloudChart("#chart-container1");
// create a pie chart under #chart-container2 element using chart group A
var chart2 = dc.wordCloudChart("#chart-container2", "chartGroupA");
```

**/
dc.wordCloudChart = function (parent, chartGroup) {
    var _chart = dc.wheelMixin(dc.colorMixin(dc.baseMixin({})));

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
            .selectAll("div")
            .data(_chart.data())
            .enter()
            .append('div')
            .attr("class", function (d) {
                var selectClass = "dc-word";
                if (isSelected(_chart.keyAccessor()(d))) { selectClass += " selected"; }
                if (isDeselected(_chart.keyAccessor()(d))) { selectClass += " deselected"; }
                return selectClass;
            })
            .style("font-size", function (d) { return getSize(d.value)+"px"; })
            .style("color", function (d, i) { return _chart.getColor(d.value, i); })
            .html(function(d) {
                return _chart.label()(d);
            })
            .attr("title", renderTitle)
            .on("click", onClick)
            .on("mousewheel", function (d) { _chart.onMouseWheel(d); })
            .on("DOMMouseScroll", function (d) { _chart.onMouseWheel(d); }) // older versions of Firefox
            .on("wheel", function (d) { _chart.onMouseWheel(d); }); // newer versions of Firefox

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

    return _chart.anchor(parent, chartGroup);
};
