/**
## Geo Choropleth Chart
Includes: [Wheel Mixin](#wheel-mixin), [Color Mixin](#color-mixin), [Base Mixin](#base-mixin)

The geo choropleth chart is designed as an easy way to create a crossfilter driven choropleth map
from GeoJson data. This chart implementation was inspired by [the great d3 choropleth
example](http://bl.ocks.org/4060606).

Examples:
* [US Venture Capital Landscape 2011](http://dc-js.github.com/dc.js/vc/index.html)
#### dc.geoChoroplethChart(parent[, chartGroup])
Create a choropleth chart instance and attach it to the given parent element.

Parameters:
* parent : string | node | selection - any valid
 [d3 single selector](https://github.com/mbostock/d3/wiki/Selections#selecting-elements) specifying
 a dom block element such as a div; or a dom element or d3 selection.

* chartGroup : string (optional) - name of the chart group this chart instance should be placed in.
 Interaction with a chart will only trigger events and redraws within the chart's group.

Returns:
A newly created choropleth chart instance

```js
// create a choropleth chart under '#us-chart' element using the default global chart group
var chart1 = dc.geoChoroplethChart('#us-chart');
// create a choropleth chart under '#us-chart2' element using chart group A
var chart2 = dc.compositeChart('#us-chart2', 'chartGroupA');
```

**/
dc.geoChoroplethChart = function (parent, chartGroup) {
    var _chart = dc.wheelMixin(dc.colorMixin(dc.baseMixin({})));

    _chart.colorAccessor(function (d) {
        return d || 0;
    });

    var _geoPath = d3.geo.path();
    var _projectionFlag;

    var _geoJsons = [];

    var _nbZoomLevels = 0;

    //Drag the map.
    var m0,o0,m1,o1,scale;
    var drag = d3.behavior.drag()
         .on("dragstart",function(){
            m0 = [d3.event.sourceEvent.pageX,d3.event.sourceEvent.pageY];
            o0 = [-parseFloat(parseTransform(_chart.layers().attr("transform")).translate[0]),-parseFloat(parseTransform(_chart.layers().attr("transform")).translate[1])];
            scale = [parseFloat(parseTransform(_chart.layers().attr("transform")).scale[0]),parseFloat(parseTransform(_chart.layers().attr("transform")).scale[1])];
         })
          .on("drag",function(){
              if(m0){
                  m1 = [d3.event.sourceEvent.pageX,d3.event.sourceEvent.pageY];
                  o1 = [-(o0[0]+m0[0]-m1[0]),-(o0[1]+m0[1]-m1[1])];
                  parseTransform(_chart.layers().attr("transform")).translate[0] = o1[0];
                  parseTransform(_chart.layers().attr("transform")).translate[1] = o1[1];
               }
            setTransform(scale,[o1[0],o1[1]],0);
            });

    _chart.layers = function() {
        return _chart.svg().select("g.layers");
    };

    _chart._doRender = function () {
        _chart.resetSvg();
        _chart.svg()
            .on('mousewheel', function (d) { _chart.onMouseWheel(d, false, true); })
            .on("DOMMouseScroll", function (d) { _chart.onMouseWheel(d, false, true); }) // older versions of Firefox
            .on("wheel", function (d) { _chart.onMouseWheel(d, false, true); }) // newer versions of Firefox
            .call(drag)
            .append("g").attr("class", "layers");

        for (var layerIndex = 0; layerIndex < _geoJsons.length; ++layerIndex) {
            var regions = _chart.layers().append("g")
                .attr("class", "layer" + layerIndex);

            var regionG = regions.selectAll("g." + geoJson(layerIndex).name)
                .data(geoJson(layerIndex).data)
                .enter()
                .append('g')
                .attr('class', geoJson(layerIndex).name);

            regionG
                .append('path')
                .attr('fill', 'white')
                .attr('d', _geoPath);

            regionG.append('title');

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
            .classed('selected', function (d) {
                return isSelected(layerIndex, d);
            })
            .classed('deselected', function (d) {
                return isDeselected(layerIndex, d);
            })
            .attr('class', function (d) {
                var layerNameClass = geoJson(layerIndex).name;
                var regionClass = dc.utils.nameToId(geoJson(layerIndex).keyAccessor(d));
                var baseClasses = layerNameClass + ' ' + regionClass;
                if (isSelected(layerIndex, d)) {
                    baseClasses += ' selected';
                }
                if (isDeselected(layerIndex, d)) {
                    baseClasses += ' deselected';
                }
                return baseClasses;
            });
        return regionG;
    }

    function layerSelector(layerIndex) {
        return 'g.layer' + layerIndex + ' g.' + geoJson(layerIndex).name;
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
            .select('path')
            .attr('fill', function () {
                var currentFill = d3.select(this).attr('fill');
                if (currentFill) {
                    return currentFill;
                }
                return 'none';
            })
            .on('click', function (d) {
                if (layerIndex == _geoJsons.length - 1) {
                    return _chart.onClick(d, layerIndex);
                } else {
                    if (!d3.event.defaultPrevented) {
                          _chart._zoomOut(Math.max(0, _geoJsons.length - 1 - layerIndex));
                          _chart._zoomIn(d, {});
                    }
                }
            })
        if (layerIndex == _geoJsons.length - 1 && layerIndex < _nbZoomLevels) {
            paths
                .on("mousewheel", function (d) { _chart.onMouseWheel(d); })
                .on("DOMMouseScroll",  function (d) { _chart.onMouseWheel(d); }) // older versions of Firefox
                .on("wheel",  function (d) { _chart.onMouseWheel(d); }); // newer versions of Firefox
        } else {
            paths
                .on("mousewheel", null)
                .on("DOMMouseScroll", null) // older versions of Firefox
                .on("wheel", null); // newer versions of Firefox
        }

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
            regionG.selectAll('title').text(function (d) {
                var key = getKey(layerIndex, d);
                var value = data[key];
                return _chart.title()({key: key, value: value});
            });
        }
    }

    _chart._doRedraw = function () {
        for (var layerIndex = 0; layerIndex < _geoJsons.length; ++layerIndex) {
            // reproject
            if(_projectionFlag) {
                _chart.svg().selectAll("g." + geoJson(layerIndex).name + " path").attr("d", _geoPath);
            }

            // add missing layers
            if(_chart.svg().selectAll("g.layer" + layerIndex).empty()) {
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
            }

            plotData(layerIndex);
        }

        // remove useless layers
        while (!_chart.svg().selectAll("g.layer" + layerIndex).empty()) {
            _chart.svg().selectAll("g.layer" + layerIndex).remove();
            layerIndex++;
        }

        _projectionFlag = false;
    };

    /**
    #### .overlayGeoJson(json, name, keyAccessor) - **mandatory**
    Use this function to insert a new GeoJson map layer. This function can be invoked multiple times
    if you have multiple GeoJson data layers to render on top of each other. If you overlay multiple
    layers with the same name the new overlay will override the existing one.

    Parameters:
    * json - GeoJson feed
    * name - name of the layer
    * keyAccessor - accessor function used to extract 'key' from the GeoJson data. The key extracted by
    this function should match the keys returned by the crossfilter groups.

    ```js
    // insert a layer for rendering US states
    chart.overlayGeoJson(statesJson.features, 'state', function(d) {
        return d.properties.name;
    });
    ```

    **/
    _chart.overlayGeoJson = function (json, name, keyAccessor) {
        for (var i = 0; i < _geoJsons.length; ++i) {
            if (_geoJsons[i].name === name) {
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
    Set custom geo projection function. See the available [d3 geo projection
    functions](https://github.com/mbostock/d3/wiki/Geo-Projections).  Default value: albersUsa.

    **/
    _chart.projection = function (projection) {
        _geoPath.projection(projection);
        _projectionFlag = true;
        return _chart;
    };

    /**
    #### .geoJsons()
    Returns all GeoJson layers currently registered with this chart. The returned array is a
    reference to this chart's internal data structure, so any modification to this array will also
    modify this chart's internal registration.

    Returns an array of objects containing fields {name, data, accessor}

    **/
    _chart.geoJsons = function () {
        return _geoJsons;
    };

    /**
    #### .geoPath()
    Returns the [d3.geo.path](https://github.com/mbostock/d3/wiki/Geo-Paths#path) object used to
    render the projection and features.  Can be useful for figuring out the bounding box of the
    feature set and thus a way to calculate scale and translation for the projection.

    **/
    _chart.geoPath = function () {
        return _geoPath;
    };

    /**
    #### .removeGeoJson(name)
    Remove a GeoJson layer from this chart by name

    **/
    _chart.removeGeoJson = function (name) {
        var geoJsons = [];

        for (var i = 0; i < _geoJsons.length; ++i) {
            var layer = _geoJsons[i];
            if (layer.name !== name) {
                geoJsons.push(layer);
            }
        }
        _geoJsons = geoJsons;

        return _chart;
    };

    /**
     * Set the number of zoom levels available
     */
    _chart.setNbZoomLevels = function (nbLevels) {
        _nbZoomLevels = nbLevels;
        return _chart;
    };

    /**
    * Callback to pan the map during drag
    */
    function panMap() {
        _chart.addTranslate([d3.event.dx, d3.event.dy], 0);
    }

    _chart._zoomIn = function (d, keys) {
        var elements = [];
        if(keys.ctrl){
            elements = _chart.filters();
        } else {
            elements.push(d.id);
        }
        _chart._onZoomIn(elements);
        _chart.callbackZoomIn()(d.id, _chart.chartID(), keys);
    };

    _chart._zoomOut = function (nbLevels) {
        _chart._onZoomOut();
        _chart.callbackZoomOut()(nbLevels, _chart.chartID());
    };

    /*
     * Function called when drilling down on d or on all selected members : focus on d and call drill down of Display
     */
    _chart._onZoomIn = function (elements) {
        var geom = [];
        var layerData = this.geoJsons()[this.geoJsons().length - 1].data
        for (var i in layerData) {
            for(var j in elements){
                if (layerData[i].id === elements[j]) {
                    geom.push(layerData[i]);
                }
            }
        }
        _chart._adaptTo({"type": "GeometryCollection", "geometries": geom}, 750);
    };

    /*
     * Called when rolling up from the current level
     */
    _chart._onZoomOut = function () {
        _chart._adaptTo({
          "type": "GeometryCollection",
          "geometries": geoJson(Math.max(0, _geoJsons.length - 2)).data
          }, 700
        );
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
            .style("stroke", "white")
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
        a = a.match(/(\w+\((\-?\d+\.?\d*,?)+\))/g);

        for (var i in a){
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
