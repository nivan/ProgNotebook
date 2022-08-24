import ipywidgets as widgets
from traitlets import Unicode, Int
import json

# See js/lib/example.js for the frontend counterpart to this file.


@widgets.register
class HelloWorld(widgets.DOMWidget):
    """An example widget."""

    # Name of the widget view class in front-end
    _view_name = Unicode('HelloView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('HelloModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('progNotebook').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('progNotebook').tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode('^0.1.0').tag(sync=True)

    # Widget specific property.
    # Widget properties are defined as traitlets. Any property tagged with `sync=True`
    # is automatically synced to the frontend *any* time it changes in Python.
    # It is synced back to Python from the frontend *any* time the model is touched.
    value = Unicode('Hello World!').tag(sync=True)


@widgets.register
class ProgScatterWidget(widgets.DOMWidget):
    """An example widget."""

    # Name of the widget view class in front-end
    _view_name = Unicode('ProgScatterView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('ProgScatterModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('progNotebook').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('progNotebook').tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode('^0.1.0').tag(sync=True)

    # Widget specific property.
    # Widget properties are defined as traitlets. Any property tagged with `sync=True`
    # is automatically synced to the frontend *any* time it changes in Python.
    # It is synced back to Python from the frontend *any* time the model is touched.
    value = Unicode('Hello World!').tag(sync=True)
    #
    marginals = Unicode('{"mx":[],"my":[],"mz":[]}').tag(sync=True)
    #'xDomainRange':[0,1],'yDomainRange':[0,1],'zDomainRange':[0,1],'xRes':10,'yRes':10,'xLabel':'xAxis','yLabel':'yAxis','zLabel':'zLabel','sparse':0,'bins':[],'counts':[]
    scatData = Unicode("{}").tag(sync=True)
    #
    progress = Unicode('{"current":0, "max":0}').tag(sync=True)
    #
    restart = Int(0).tag(sync=True)

    def __init__(self, **kwargs):
        widgets.DOMWidget.__init__(self, **kwargs) # Call the base.

       
    def _restart_changed(self, name, old_value, new_value):
        print('Restart changed!!!!!!',name,old_value,new_value)


    def _value_changed(self, name, old_value, new_value):
        print("Value Changed")