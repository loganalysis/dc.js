[![Build Status](https://api.travis-ci.org/loganalysis/dc.js.png?branch=master)](http://travis-ci.org/loganalysis/dc.js)
[![Sauce Status](https://saucelabs.com/buildstatus/loganalysis_csjs)](https://saucelabs.com/u/loganalysis_csjs)

dc.js
=====

Dimensional charting built to work natively with crossfilter rendered using d3.js. Check out the
[example page](http://dc-js.github.com/dc.js/) with a quick five minutes how to guide. For a
detailed [API reference](https://github.com/dc-js/dc.js/blob/master/web/docs/api-1.6.0.md) and
more please visit the [Wiki](https://github.com/dc-js/dc.js/wiki).


CDN location
--------------------
```
http://cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc.js
http://cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc.min.js
http://cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc.css
```
Please do not use github.io as a CDN unless you need the bleeding-edge features.

[More info on the Wiki.](https://github.com/dc-js/dc.js/wiki#cdn-location)


Install with npm
--------------------
```
npm install dc
```


Install without npm
--------------------
Download
* [d3.js](https://github.com/mbostock/d3)
* [crossfilter.js](https://github.com/square/crossfilter)
* [dc.js - stable](https://github.com/dc-js/dc.js/releases)
* [dc.js - bleeding edge (master)](https://github.com/dc-js/dc.js)


How to build dc.js locally
---------------------------

### Prerequisite modules

Make sure the following packages are installed on your machine
* node.js
* npm

### Install dependencies
```
dc.js$ npm install
```

### Build and Test
```
dc.js$ grunt test
```

Developing dc.js
----------------

### Start the development server
```
dc.js$ grunt server
```

* Jasmine specs are hosted at http://localhost:8888/spec
* The stock example is at http://localhost:8888/web
* More examples are at http://localhost:8888/web/examples

License
--------------------

dc.js is an open source javascript library and licensed under
[Apache License v2](http://www.apache.org/licenses/LICENSE-2.0.html).
