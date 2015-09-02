var requireConfig = {
  baseUrl: '../lib',
  paths: {
    'frontend'  : '../frontend/js',
    'backend'   : '../backend/js',
    'remote'    : '../remote/js'
  },
  shim: {
    'leaflet/js/leaflet.contextmenu': {
      deps: ['leaflet/js/leaflet'],
      exports: 'LeafletContextmenu'
    },
    'backbonejs/js/backbone': {
      deps: ['underscorejs/js/underscore'],
      exports: 'Backbone'
    },
    'bootstrap/js/bootstrap.min': {
      deps: ['jquery/js/jquery.min'],
      exports: 'Bootstrap'
    },
    'bootstrap/js/bootstrap-tagsinput.min': {
      deps: ['bootstrap/js/bootstrap.min'],
      exports: 'BootstrapTagsinput'
    },
    'jquery/js/jquery-ui.min': {
      deps: ['jquery/js/jquery.min'],
      exports: 'JQueryUI'
    },
    'threejs/js/three.min': {
      exports: 'THREE'
    },
    'threejs/js/Detector': {
      deps: ['threejs/js/three.min'],
      exports: 'Detector'
    },
    'threejs/js/CSS3DRenderer': {
      deps: ['threejs/js/three.min'],
      exports: 'CSS3DRenderer'
    },
    'threejs/js/TransformControls': {
      deps: ['threejs/js/three.min'],
      exports: 'TransformControls'
    },
    'seriouslyjs/js/seriously': {
      exports: 'Seriously'
    },
    'seriouslyjs/js/seriously.chroma': {
      deps: ['seriouslyjs/js/seriously'],
      exports: 'SeriouslyChroma'
    },
    'seriouslyjs/js/seriously.crop': {
      deps: ['seriouslyjs/js/seriously'],
      exports: 'SeriouslyCrop'
    },
    'leaflet/js/leaflet.awesome-markers.min': {
      deps: ['bootstrap/js/bootstrap.min'],
      exports: 'LeafletAwesomeMarker'
    },
    'bootstrap-bootbox/js/bootbox.min': {
        deps: ['bootstrap/js/bootstrap.min',
            'jquery/js/jquery.min'],
        exports: 'bootbox'
    },
    'bootstrap-switch/dist/js/bootstrap-switch.min': {
        deps: ['bootstrap/js/bootstrap.min',
            'jquery/js/jquery.min'],
        exports: 'Switch'
    }
  }
};
