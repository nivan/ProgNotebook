var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var d3 = require('d3');
var progWidgets = require('./progWidget.js');
require('../css/widget.css');


// See example.py for the kernel counterpart to this file.


// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var ProgScatterModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name: 'ProgScatterModel',
        _view_name: 'ProgScatterView',
        _model_module: 'progNotebook',
        _view_module: 'progNotebook',
        _model_module_version: '0.1.0',
        _view_module_version: '0.1.0',
        value: 'Hello World!',
        marginals: '{"mx":[],"my":[],"mz":[]}',
        scatData: "{}",
        progress: 0
    })
});


// Custom View. Renders the widget model.
var ProgScatterView = widgets.DOMWidgetView.extend({
    // Defines how the widget gets rendered into the DOM
    render: function () {
        this.myWidget = new progWidgets.ProgWidget(d3.select(this.el), this);

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:marginals', this.changeMarginals, this);
        this.model.on('change:scatData', this.changeScatData, this);
        this.model.on('change:progress', this.changeProgress, this);
    },
    changeMarginals: function () {
        var marginals = JSON.parse(this.model.get('marginals'));
        this.myWidget.setMarginals(marginals.mx, marginals.my, marginals.mz);
    },
    changeScatData: function () {
        var _scatData = JSON.parse(this.model.get('scatData'));
        this.myWidget.setScatData(_scatData);
    },
    signalStopProgression: function () {
        console.log(this);
    },
    changeProgress: function () {
        this.myWidget.setProgress(this.model.get('progress'));
    }
});


module.exports = {
    ProgScatterModel: ProgScatterModel,
    ProgScatterView: ProgScatterView
};
