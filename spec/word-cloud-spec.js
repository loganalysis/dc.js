describe('dc.wordCloudChart', function(){
    var id, chart, data;
    var dateFixture;
    var group;
    var countryDimension;

    beforeEach(function() {
    	dateFixture = loadDateFixture();
        data = crossfilter(dateFixture);    
        countryDimension = data.dimension(function(d) {
            return d.countrycode;
        });    
        group = countryDimension.group().reduceSum(function (d){ return d["value"]})
        
	id = "word-cloud";
        appendChartID(id);        
        chart = dc.wordCloudChart("#" + id)
            .width(500)
            .height(400)
            .dimension(countryDimension)
            .group(group)
            .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
            .colorDomain([0, 200])
            .colorCalculator(function (d) { return d ? chart.colors()(d) : '#ccc'; })
            .label(function (d) { return d.key; })
            .title(function (d) { return d.value; });
    });
    
    describe('word-cloud creation', function () {
        beforeEach(function(){
           return chart;
        });
        
        it('should registered the chart with DC', function(){
            expect(dc.hasChart(chart)).toBeTruthy();
        });

        it('should set a dimension on the chart', function () {
            expect(chart.dimension()).toBe(countryDimension);
        });

        it('should set a group on the chart', function () {
            expect(chart.group()).toBe(group);
        });

        it('should set a width on the chart', function () {
            expect(chart.width()).toBe(500);
        });

        it('should set a height on the chart', function () {
            expect(chart.height()).toBe(400);
        });
        
        it('assigns colors', function () {
          expect(chart.colors()).not.toBeNull();
        });
        
        it('check domain', function() {   
          expect(chart.colorDomain()).toEqual([0,200]);
        });
        
        it('label exists', function(){
          expect(chart.label()).toBeTruthy();
        });
        
        it('title exists', function(){
          expect(chart.title()).toBeTruthy();
        }); 
        
        it('colorCalculator exists', function(){
          expect(chart.colorCalculator()).toBeTruthy();
        }); 
        
    });
});
