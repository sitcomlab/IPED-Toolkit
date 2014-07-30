/*!
* The iPED Toolkit
* Frontend
*
* (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*/

require.config({
  baseUrl: '../lib',
  paths: {
    'frontend'  : '../frontend/js',
    'backend'   : '../backend/js',
  },
  shim: {
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
    'backbonejs/js/backbone': {
      deps: ['underscorejs/js/underscore'],
      exports: 'Backbone'
    }
  }
});

require(['jsnlog/js/jsnlog.min',
         'jquery/js/jquery.min',
         'socketio/js/socket.io',
         'utils/js/getUrlParameters',
         'underscorejs/js/underscore',
         'backbonejs/js/backbone',
         
         // Additional iPED Toolkit Plugins, e.g., Overlays
         'frontend/overlayPlugin',
         'frontend/chromaKeyPlugin'],
         
         function(JSNLog, JQuery, Socket, getUrlParameters, Underscore, Backbone, OverlayPlugin, ChromaKeyPlugin) {
           (function setupJSNLog() {
             var consoleAppender = JL.createConsoleAppender('consoleAppender');
             JL().setOptions({
               'appenders': [consoleAppender],
               //'level': JL.getOffLevel()
               'level': JL.getDebugLevel()
               //'level': JL.getErrorLevel()
             });
      
             /* This is an example log output:
             JL('iPED Toolkit.Frontend').fatal('Something very bad happened!');
             */
           })();
           
           /**
           * The Backbone.js model of a location
           */
           Location = Backbone.Model.extend({
             urlRoot: '/api/locations',
             initialize: function() {
               _.bindAll(this, 'fetch');
             }
           });
           
           /**
           * The Backbone.js model of a video
           */
           Video = Backbone.Model.extend({
             urlRoot: '/api/videos',
             initialize: function() {
               _.bindAll(this, 'fetch');
             }
           });
           
           /**
           * The Backbone.js collection of videos
           */
           Videos = Backbone.Collection.extend({
             model: Video
           });
           
           /**
            * The frontend of the iPED Toolkit.
            * @constructor
            */
           function Frontend() {
             this.location = null;
             this.socket = null;
             this.video = new Video;
             this.myHooks = [];
             this.myHooks['setLocationId'] = [];
             this.myHooks['onWindowResize'] = [];
  
             this.activateWebSockets();
             this.setLocationId(getURLParameters('locationId'));
             
             _.bindAll(this, 'onWindowResize');
             window.addEventListener('resize', this.onWindowResize);
           }

           /**
            * Activates the web sockets that are used by the remote control.
            */
           Frontend.prototype.activateWebSockets = function() {
             this.socket = io.connect(window.location.origin);
             this.socket.on('goToLocation', function(data) {
               JL('iPED Toolkit.Frontend').debug(data);
               this.goToLocation(data.locationId);
             });
             JL('iPED Toolkit.Frontend').debug('Web sockets activated');
           };

           /**
            * Fetches the location matching locationId from the server and loads it
            * @param {Number} locationId - The ID of the requested location
            */
           Frontend.prototype.setLocationId = function(locationId) {
             var thiz = this;
  
             if (!locationId) {
               JL('iPED Toolkit.Frontend').error('Please sepcify URL parameter "locationId"!');
               return;
             }
  
             JL('iPED Toolkit.Frontend').info('Set Location ID to: ' + locationId);
             this.location = new Location({id: locationId});
             this.location.fetch({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Frontend').debug(thiz.location);
                 thiz.loadVideo();
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Frontend').error(respone); 
               }
             });
             
             this.myHooks['setLocationId'].forEach(function(hook) {
               hook(locationId);
             }, this);
           };

           /**
           * Loads the video that belongs to the current location
           */
           Frontend.prototype.loadVideo = function() {
             var thiz = this;

             this.videos  = new Videos();
             this.videos.url = '/api/locations/' + this.location.get('id') + '/videos';
             this.videos.fetch({
               success: function(model, response, options) {
                 thiz.video = thiz.videos.at(0);
                 JL('iPED Toolkit.Frontend').debug('Loading video id ' + thiz.video.get('id') + ' for current location');
                 // Remove current video
                 $('#iPED-Video').empty();
                 
                 // Fill video tag with the new source
                 $('#iPED-Video').append('<source id ="video_source_mp4" src="' + thiz.video.get('url') + '.mp4" type="video/mp4" />');
                 $('#iPED-Video').append('<source id ="video_source_ogv" src="' + thiz.video.get('url') + '.ogv" type="video/ogg" />');  
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Frontend').error(respone);
               }
             });
           };
           
           /*
           * Update/refresh views when window resizes
           */
           Frontend.prototype.onWindowResize = function() {
             this.myHooks['onWindowResize'].forEach(function(hook) {
               hook($(window).width(), $(window).height());
             }, this);
           }
           
           $(document).ready(function() {
             var frontend = new Frontend();
             var overlayPlugin = new OverlayPlugin({parent: frontend});
             var chromaKeyPlugin = new ChromaKeyPlugin({parent: overlayPlugin});
           });
         }
);
