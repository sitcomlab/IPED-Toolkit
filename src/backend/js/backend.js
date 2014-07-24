/*!
* The iPED Toolkit
* Backend
*
* (c) 2014 Tobias Brüggentisch, Morin Ostkamp
* Institute for Geoinformatics (ifgi), University of Münster
*/

require.config({
  baseUrl: '../lib',
  paths: {
    'frontend'  : '../frontend/js',
    'backend'   : '../backend/js',
  },
  shim: {
    'leaflet/js/leaflet': {
      exports: 'Leaflet'
    },
    'leaflet/js/leaflet.contextmenu': {
      deps: ['leaflet/js/leaflet'],
      exports: 'LeafletContextmenu'
    }
  }
});

require(['jsnlog/js/jsnlog.min',
         'jquery/js/jquery.min',
         'jquery/js/jquery-ui.min',
         'bootstrap/js/bootstrap.min',
         'utils/js/getUrlParameters',
         'underscorejs/js/underscore',
         'backbonejs/js/backbone',
         'leaflet/js/leaflet',
         'leaflet/js/leaflet.contextmenu'],
         
         function(JSNLog, JQuery, JQueryUI, Bootstrap, getUrlParameters, Underscore, Backbone, Leaflet, LeafletContextmenu) {
           (function setupJSNLog() {
             var consoleAppender = JL.createConsoleAppender('consoleAppender');
             JL().setOptions({
               'appenders': [consoleAppender],
               //'level': JL.getOffLevel()
               'level': JL.getDebugLevel()
               //'level': JL.getErrorLevel()
             });
      
             /* This is an example log output:
             JL('iPED Toolkit.Backend').fatal('Something very bad happened!');
             */
           })();
           
           var TPL_PATH = 'requirejs/js/text!../backend/templates/';
           
           /**
           * The Backbone.js model of a location
           */
           Location = Backbone.Model.extend({
             urlRoot: SERVER_URL + PORT + 'api/locations',
             initialize: function() {
               _.bindAll(this, 'fetch');
             }
           });
           
           /**
           * The backbone.js collection for locations
           */
           Locations = Backbone.Collection.extend({
             model: Location,
             url: SERVER_URL + PORT + 'api/locations'
           });
           
           LocationMakerView = Backbone.View.extend({
             initialize: function(){
               this.render();
             },
             render: function(){
               var thiz = this;
               require([TPL_PATH+'locationMarkerView.tpl'], function (html) {
                 var template = _.template(html, thiz.model.attributes);
                 thiz.$el.html(template); 
               });
               return this;
             }
           });
         
           /**
            * The backend of the iPED Toolkit.
            * @constructor
            */
           function Backend() {
             this.glob = [];
             this.map = null;
             this.coords = null;
             
             this.initMap();
             this.drawMarkers();
           }
           
           /**
           * Initializes the leaflet map
           */
           Backend.prototype.initMap = function() {
           	var options = {
           		contextmenu: true,
           		contextmenuWidth: 180,
           		contextmenuItems: [{text: 'Add New Location Here',
                                  callback : null}]
           	};
            var muenster = [51.962655, 7.625763];
            var zoom = 15;

           	this.map = L.map('map', options).setView(muenster, zoom);
           	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
           		attribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
           		maxZoom : 18
           	}).addTo(this.map);
            
           	this.map.on('contextmenu', function(e) {
           		this.coords = e.latlng;
              JL('iPED Toolkit.Backend').debug('Click on map (' + this.coords + ')');
           	});
           };
           
           /**
           * Fetches all locations from the server and draws markers on the map accordingly
           */
           Backend.prototype.drawMarkers = function() {
             var thiz = this;
             var markerIcon = L.icon({
                 iconUrl: '../lib/leaflet/images/marker-icon.png',
                 shadowUrl: '../lib/leaflet/images/marker-shadow.png'
             });
             
             this.locations = new Locations();
             this.locations.fetch({
               success: function(model, response, options) {
                 thiz.locations.each(function(location) {
                  JL('iPED Toolkit.Backend').debug(location);
                  var locationMarkerView = new LocationMakerView({model: location});
           				L.marker([location.get('lat'), location.get('lon')],
                           {icon: markerIcon, riseOnHover: true, riseOffset: 25})
                   .addTo(thiz.map)
                   .bindPopup(locationMarkerView.el);
                 });
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Backend').error(respone); 
               } 
             });
           };
           
           $(document).ready(function() {
             var backend = new Backend();
           });
         }
);
