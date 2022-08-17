var _helloWorld = require("./example.js");
var _progscatterplotChart = require("./progscatter.js");

module.exports = {
    HelloModel: _helloWorld.HelloModel,
    HelloView: _helloWorld.HelloView,
    ProgScatterModel: _progscatterplotChart.ProgScatterModel,
    ProgScatterView: _progscatterplotChart.ProgScatterView,
};

module.exports['version'] = require('../package.json').version;
