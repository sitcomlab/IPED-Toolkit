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
    },
    'backbonejs/js/backbone': {
      deps: ['underscorejs/js/underscore'],
      exports: 'Backbone'
    }
  }
});

require(['jsnlog/js/jsnlog.min',
         'jquery/js/jquery.min',
         'jquery/js/jquery-ui.min',
         'bootstrap/js/bootstrap.min',
         'bootstrap/js/bootstrap-tagsinput.min',
         'utils/js/getUrlParameters',
         'underscorejs/js/underscore',
         'backbonejs/js/backbone',
         'leaflet/js/leaflet',
         'leaflet/js/leaflet.contextmenu',
         'form2js/js/form2js'],
         
         function(JSNLog, JQuery, JQueryUI, Bootstrap, BootstrapTagsinput, getUrlParameters, Underscore, Backbone, Leaflet, LeafletContextmenu, form2js) {
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
             },
             defaults: {
               // According to API specification 25.07.2014
               name: '',
               description: '',
               tags: [],
               lat: '',
               lon: '',
               relatedLocations: [],
               videos: [],
               overlays: []
             }
           });
           
           /**
           * The backbone.js collection for locations
           */
           Locations = Backbone.Collection.extend({
             model: Location,
             url: SERVER_URL + PORT + 'api/locations'
           });
           
           /**
           * The backbone.js view for a leaflet marker
           */
           LocationMakerView = Backbone.View.extend({
             initialize: function() {
               this.render();
             },
             render: function() {
               var thiz = this;
               require([TPL_PATH+'locationMarkerView.tpl'], function (html) {
                 var template = _.template(html, thiz.model.location.attributes);
                 thiz.$el.html(template); 
                 thiz.$el.find('input[data-role=tagsinput]').tagsinput({tagClass: function(item) {return 'label label-default';}});
                 _.each(thiz.model.location.get('tags'), function(tag) {
                   thiz.$el.find('input[data-role=tagsinput]').tagsinput('add', tag);
                 });
               });
               return this;
             },
             events: {
               'click button.add': '_add',
               'click button.edit': '_edit',
               'click button.delete': '_delete'
             },
             _add: function() {this.model.frontend.addLocation(this.model.location);},
             _edit: function() {this.model.frontend.editLocation(this.model.location);},
             _delete: function() {this.model.frontend.deleteLocation(this.model.location);}
           });
           
           /**
           * The backbone.js view used for editing a location
           */
           LocationEditView = Backbone.View.extend({
             initialize: function() {
               this.render();
             },
             render: function() {
               var thiz = this;
               require([TPL_PATH+'locationEditView.tpl'], function (html) {
                 var template = _.template(html, thiz.model.location.attributes);
                 thiz.$el.html(template);
                 thiz.$el.find('select[data-role=tagsinput]').tagsinput({tagClass: function(item) {return 'label label-primary';}});
                 _.each(thiz.model.location.get('tags'), function(tag) {
                   thiz.$el.find('select[data-role=tagsinput]').tagsinput('add', tag);
                 });
               });
               return this;
             },
             events:
             {
               'click button.save': '_save'
             },
             _save: function() {
               this.model.frontend.saveLocation(this.model.location, 
                                                form2js(this.$el.find('form')[0], '.', true));
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
                                  callback : this.addLocation}]
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
                   JL('iPED Toolkit.Backend').debug('Adding marker for location: ' + JSON.stringify(location));
                   var locationMarkerView = new LocationMakerView({model: {location: location, frontend: thiz}});
                   L.marker([location.get('lat'), location.get('lon')],
                            {icon: markerIcon, riseOnHover: true, riseOffset: 25})
                   .addTo(thiz.map)
                   .bindPopup(locationMarkerView.el, {minWidth: 300});
                 });
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Backend').error(respone); 
               } 
             });
           };
           
           /**
           * Add a new location, either a new one (location == null) or to an existing location (location != null)
           * @param location - Either null (add new location) or existing location
           */
           Backend.prototype.addLocation = function(location) {
             if (location instanceof Backbone.Model) {
               JL('iPED Toolkit.Backend').debug('Add new location to existing location: ' + JSON.stringify(location)); 
             } else {
               JL('iPED Toolkit.Backend').debug('Add new location: ' + JSON.stringify(location)); 
             }
           }
           
           /**
           * Edit an existing location
           * @param location - The location to be edited
           */
           Backend.prototype.editLocation = function(location) {
             JL('iPED Toolkit.Backend').debug('Edit location: ' + JSON.stringify(location));
             this.map.closePopup();
             var locationEditView = new LocationEditView({model: {location: location, frontend: this}});
             $(locationEditView.el).dialog({title: 'Edit location',
                                            position: {my: 'left+100 top+100',
                                                       at: 'center top',
                                                       of: this.map[0]
                                                      }
                                            })
                                   .dialog('open');
           }
           
           /**
           * Delete a location
           * @param location - The location to be deleted
           */
           Backend.prototype.deleteLocation = function(location) {
             JL('iPED Toolkit.Backend').debug('About to delete location: ' + JSON.stringify(location)); 
           }
           
           /**
           * Save a location by pushing it the the server
           * @param location - The location to be saved
           * @param attributes - The set of (changed) attributes
           */
           Backend.prototype.saveLocation = function(location, attributes) {
             JL('iPED Toolkit.Backend').debug('Save location: ' + JSON.stringify(location) + ', with new attributes: ' + JSON.stringify(attributes)); 
             location.save(attributes);             
           }
           
           $(document).ready(function() {
             var backend = new Backend();
           });
         }
);
