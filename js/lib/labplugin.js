var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'progNotebook:plugin',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'progNotebook',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

