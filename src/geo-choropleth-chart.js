/**
## Geo Choropleth Chart

Includes: [Color Mixin](#color-mixin), [Base Mixin](#base-mixin)

Geo choropleth chart is designed to make creating crossfilter driven choropleth
map from GeoJson data an easy process. This chart implementation was inspired by
[the great d3 choropleth example](http://bl.ocks.org/4060606).

Examples:
* [US Venture Capital Landscape 2011](http://dc-js.github.com/dc.js/vc/index.html)

#### dc.geoChoroplethChart(parent[, chartGroup])
Create a choropleth chart instance and attach it to the given parent element.

Parameters:
* parent : string - any valid d3 single selector representing typically a dom block element such as a div.
* chartGroup : string (optional) - name of the chart group this chart instance should be placed in. Once a chart is placed
   in a certain chart group then any interaction with such instance will only trigger events and redraw within the same
   chart group.

Return:
A newly created choropleth chart instance

```js
// create a choropleth chart under "#us-chart" element using the default global chart group
var chart1 = dc.geoChoroplethChart("#us-chart");
// create a choropleth chart under "#us-chart2" element using chart group A
var chart2 = dc.compositeChart("#us-chart2", "chartGroupA");
```

**/
dc.geoChoroplethChart = function (parent, chartGroup) {
    var _chart = dc.colorMixin(dc.baseMixin({}));

    _chart.colorAccessor(function (d) {
        return d || 0;
    });

    var _geoPath = d3.geo.path();
    var _projectionFlag;

    var _geoJsons = [];

    _chart.layers = function() {
        return _chart.svg().select("g.layers");
    };

    _chart._doRender = function () {
        _chart.resetSvg();
        _chart.svg()
            .on('mousewheel', onMouseWheelRollUp)
            .on("DOMMouseScroll", onMouseWheelRollUp) // older versions of Firefox
            .on("wheel", onMouseWheelRollUp) // newer versions of Firefox
            .call(d3.behavior.drag().on("drag", panMap))
          .append("g").attr("class", "layers");

        for (var layerIndex = 0; layerIndex < _geoJsons.length; ++layerIndex) {
            var regions = _chart.layers().append("g")
                .attr("class", "layer" + layerIndex);

            var regionG = regions.selectAll("g." + geoJson(layerIndex).name)
                .data(geoJson(layerIndex).data)
                .enter()
                .append("g")
                .attr("class", geoJson(layerIndex).name);

            regionG
                .append("path")
                .attr("fill", "white")
                .attr("d", _geoPath);

            regionG.append("title");

            plotData(layerIndex);
        }

        _chart._adaptTo({ "type": "GeometryCollection", "geometries": geoJson(_geoJsons.length-1).data}, 0);

        _projectionFlag = false;
    };

    function plotData(layerIndex) {
        var data = generateLayeredData();

        if (isDataLayer(layerIndex)) {
            var regionG = renderRegionG(layerIndex);

            renderPaths(regionG, layerIndex, data);
            renderTitle(regionG, layerIndex, data);

            if (_chart.showColorLegend) _chart.renderLegend();
        }
    }

    function generateLayeredData() {
        var data = {};
        var groupAll = _chart.data();
        for (var i = 0; i < groupAll.length; ++i) {
            data[_chart.keyAccessor()(groupAll[i])] = _chart.valueAccessor()(groupAll[i]);
        }
        return data;
    }

    function isDataLayer(layerIndex) {
        return geoJson(layerIndex).keyAccessor;
    }

    function renderRegionG(layerIndex) {
        var regionG = _chart.svg()
            .selectAll(layerSelector(layerIndex))
            .classed("selected", function (d) {
                return isSelected(layerIndex, d);
            })
            .classed("deselected", function (d) {
                return isDeselected(layerIndex, d);
            })
            .attr("class", function (d) {
                var layerNameClass = geoJson(layerIndex).name;
                var regionClass = dc.utils.nameToId(geoJson(layerIndex).keyAccessor(d));
                var baseClasses = layerNameClass + " " + regionClass;
                if (isSelected(layerIndex, d)) baseClasses += " selected";
                if (isDeselected(layerIndex, d)) baseClasses += " deselected";
                return baseClasses;
            });
        return regionG;
    }

    function layerSelector(layerIndex) {
        return "g.layer" + layerIndex + " g." + geoJson(layerIndex).name;
    }

    function isSelected(layerIndex, d) {
        return _chart.hasFilter() && _chart.hasFilter(getKey(layerIndex, d));
    }

    function isDeselected(layerIndex, d) {
        return _chart.hasFilter() && !_chart.hasFilter(getKey(layerIndex, d));
    }

    function getKey(layerIndex, d) {
        return geoJson(layerIndex).keyAccessor(d);
    }

    function geoJson(index) {
        return _geoJsons[index];
    }

    function renderPaths(regionG, layerIndex, data) {
        var paths = regionG
            .select("path")
            .attr("fill", function () {
                var currentFill = d3.select(this).attr("fill");
                if (currentFill)
                    return currentFill;
                return "none";
            })
            .on("click", function (d) {
                return _chart.onClick(d, layerIndex);
            })
            .on("mousewheel", onMouseWheelDrillDownRollUp)
            .on("DOMMouseScroll",  onMouseWheelDrillDownRollUp) // older versions of Firefox
            .on("wheel",  onMouseWheelDrillDownRollUp); // newer versions of Firefox

        dc.transition(paths, _chart.transitionDuration()).attr("fill", function (d, i) {
            return _chart.getColor(data[geoJson(layerIndex).keyAccessor(d)], i);
        });
    }

    _chart.onClick = function (d, layerIndex) {
        if (!d3.event.defaultPrevented) {
            var selectedRegion = geoJson(layerIndex).keyAccessor(d);
            dc.events.trigger(function () {
                _chart.filter(selectedRegion);
                _chart.redrawGroup();
            });
        }
    };

    function renderTitle(regionG, layerIndex, data) {
        if (_chart.renderTitle()) {
            regionG.selectAll("title").text(function (d) {
                var key = getKey(layerIndex, d);
                var value = data[key];
                return _chart.title()({key: key, value: value});
            });
        }
    }

    _chart._doRedraw = function () {
        for (var layerIndex = 0; layerIndex < _geoJsons.length; ++layerIndex) {
            plotData(layerIndex);
            if(_projectionFlag) {
                _chart.svg().selectAll("g." + geoJson(layerIndex).name + " path").attr("d", _geoPath);
            }
        }
        _projectionFlag = false;
    };

    /**
    #### .overlayGeoJson(json, name, keyAccessor) - **mandatory**
    Use this function to insert a new GeoJson map layer. This function can be invoked multiple times if you have multiple GeoJson
    data layer to render on top of each other. If you overlay mutiple layers with the same name the new overlay will simply
    override the existing one.

    Parameters:
    * json - GeoJson feed
    * name - name of the layer
    * keyAccessor - accessor function used to extract "key" from the GeoJson data. Key extracted by this function should match
     the keys generated in crossfilter groups.

    ```js
    // insert a layer for rendering US states
    chart.overlayGeoJson(statesJson.features, "state", function(d) {
        return d.properties.name;
    });
    ```

    **/
    _chart.overlayGeoJson = function (json, name, keyAccessor) {
        for (var i = 0; i < _geoJsons.length; ++i) {
            if (_geoJsons[i].name == name) {
                _geoJsons[i].data = json;
                _geoJsons[i].keyAccessor = keyAccessor;
                return _chart;
            }
        }
        _geoJsons.push({name: name, data: json, keyAccessor: keyAccessor});
        return _chart;
    };

    /**
    #### .projection(projection)
    Set custom geo projection function. Available [d3 geo projection functions](https://github.com/mbostock/d3/wiki/Geo-Projections).
    Default value: albersUsa.

    **/
    _chart.projection = function (projection) {
        _geoPath.projection(projection);
        _projectionFlag = true;
        return _chart;
    };

    /**
    #### .geoJsons()
    Return all GeoJson layers currently registered with thit chart. The returned array is a reference to this chart's internal
    registration data structure without copying thus any modification to this array will also modify this chart's internal
    registration.

    Return:
    An array of objects containing fields {name, data, accessor}

    **/
    _chart.geoJsons = function () {
        return _geoJsons;
    };

    /**
    #### .removeGeoJson(name)
    Remove a GeoJson layer from this chart by name

    Return: chart instance

    **/
    _chart.removeGeoJson = function (name) {
        var geoJsons = [];

        for (var i = 0; i < _geoJsons.length; ++i) {
            var layer = _geoJsons[i];
            if (layer.name != name) {
                geoJsons.push(layer);
            }
        }
        _geoJsons = geoJsons;

        return _chart;
    };

    /**
     * Set the callback function for the drillDown
     */
    _chart.setCallbackOnDrillDown = function (d) {
      _chart.callBackDrillDown = d;

      return _chart;
    };

    /**
     * Set the callback function for the rollUp
     */
    _chart.setCallbackOnRollUp = function (d) {
      _chart.callBackRollUp = d;
      return _chart;
    };

    /**
     * Call the function onMouseWheel with rigth parameters
     */
    function onMouseWheelRollUp(d) {
      onMouseWheel(d, false, true);
    }

    function onMouseWheelDrillDown(d) {
      onMouseWheel(d, true, false);
    }

    function onMouseWheelDrillDownRollUp(d) {
      onMouseWheel(d, true, true);
    }

    /**
     * Called when scrolling with mouse wheel
     */
    function onMouseWheel(d, drillDown, rollUp) {
        if (drillDown === undefined)
            drillDown = true;
        if (rollUp === undefined)
            rollUp = true;

        // drill down if zoom-in
        if ((d3.event.deltaY < 0 || d3.event.wheelDeltaY > 0) && drillDown) {
            if (!_chart._disabledActions.allMouseWheel) {
                _chart._delayAction('allMouseWheel', 700);
                _chart._drillDown(d);
            }
        }
        // roll up if zoom-out
        else if ((d3.event.deltaY > 0 || d3.event.wheelDeltaY < 0) && rollUp) {
            if (!_chart._disabledActions.allMouseWheel) {
                _chart._delayAction('allMouseWheel', 700);
                _chart._rollUp();
            }
        }

        // prevent scrolling on page
        d3.event.preventDefault();
        return false;
    }


    /**
    * Callback to pan the map during drag
    */
    function panMap() {
      _chart.addTranslate([d3.event.dx, d3.event.dy], 0);
    }

    /**
     * These 3 elements below allow to disable roll-up and drill-down during a certain time.
     * It is necessary because the mousewheel call the function several time successively.
     */
    _chart._disabledActions = {
        allMouseWheel : false,
    };

    _chart._delayAction = function(name, delay) {
        _chart._disabledActions[name] = true;
        d3.timer(function () { _chart._enableAction(name); return true; }, delay);
    };

    _chart._enableAction = function (name) {
        _chart._disabledActions[name] = false;
    };

    /**
     * Function called when drilling down on d : focus on d and call drill down of Display
     */
    _chart._drillDown = function(d) {
        _chart._adaptTo(d, 750);
        _chart.callBackDrillDown(d.id);
    };

    /**
     * Called when rolling up from the current level
     */
    _chart._rollUp = function() {
        if (_geoJsons.length >= 2){
            _chart._adaptTo({ "type": "GeometryCollection", "geometries": geoJson(_geoJsons.length - 2).data}, 700);

            _chart.callBackRollUp();
        }else{
            _chart._adaptTo({ "type": "GeometryCollection", "geometries": geoJson(0).data}, 700);
        }
    };

    /**
     * Adapt the SVG display to a geographic feature (an element or a set of elements) of the map
     */
    _chart._adaptTo = function (feature, transition) {
        var b = _geoPath.bounds(feature);
        var t = getTransformFromBounds(b);
        setTransform(t.scale, t.translate, transition);
        return _chart;
    };

    /**
     * Translate the current SVG shown
     */
    _chart.addTranslate = function (translate, transition) {
        _chart.layers().transition()
            .duration(transition)
            .attr("transform", "translate(" + translate + ") " + _chart.layers().attr("transform"));
    };

    /**
    * Scale (zoom / unzoom) on the SVG from the center of the current display
    */
    _chart.addScale = function (scale, transition) {

        var transformInit = parseTransform(_chart.layers().attr("transform"));

        var scaleInit = transformInit.scale[0];

        var t = transformInit.translate;
        var c = [_chart.width() / 2, _chart.height() / 2];

        var translate = [c[0] + (t[0] - c[0]) * scale,
                         c[1] + (t[1] - c[1]) * scale];

        setTransform(scaleInit * scale, translate, transition);
    };

    /**
     * Set the transform (scale & translate) of the SVG from scratch
     */
    function setTransform (scale, translate, transition) {
        _chart.layers()
            .transition()
            .duration(transition)
            .style("stroke-width", 1.5 / scale + "px")
            .attr("transform", "translate(" + translate + ") scale(" + scale + ") ");
    }

    /**
     * Get translate & scale parameters needed to adapt to the input bounds
     */
    function getTransformFromBounds (b) {
        var s = 0.95 / Math.max((b[1][0] - b[0][0]) / _chart.width(), (b[1][1] - b[0][1]) / _chart.height());
        var t = [(_chart.width() - s * (b[1][0] + b[0][0])) / 2, (_chart.height() - s * (b[1][1] + b[0][1])) / 2];

        return {scale: s, translate: t};
    }

    /**
     * Function to parse the transform parameter of the SVG
     */
    function parseTransform (a){
        if (a === null) {
            a = "";
        }
        var b={};

        for (var i in a = a.match(/(\w+\((\-?\d+\.?\d*,?)+\))/g)){
            var c = a[i].match(/[\w\.\-]+/g);
            b[c.shift()] = c;
        }

        if (b.translate === undefined) {
            b.translate = [0, 0];
        }
        else if (b.translate[1] === undefined) {
            b.translate[1] = 0;
        }
        if (b.scale === undefined) {
            b.scale = [1, 1];
        }
        else if (b.scale[1] === undefined) {
            b.scale[1] = b.scale[0];
        }

        return b;
    }

    return _chart.anchor(parent, chartGroup);
};
