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
    }
  }
});

require(['jsnlog/js/jsnlog.min',
         'jquery/js/jquery.min',
         'jquery/js/jquery-ui.min',
         'bootstrap/js/bootstrap.min',
         'bootstrap/js/bootstrap-tagsinput.min',
         'underscorejs/js/underscore',
         'backbonejs/js/backbone',
         'leaflet/js/leaflet',
         'leaflet/js/leaflet.contextmenu',
         'form2js/js/form2js'],
         
         function(JSNLog, JQuery, JQueryUI, Bootstrap, BootstrapTagsinput, Underscore, Backbone, Leaflet, LeafletContextmenu, form2js) {
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
           
           
           // ### <Backbone> ###
           var TPL_PATH = 'requirejs/js/text!../backend/templates/';
           
           /**
           * The Backbone.js model of a leaflet marker
           */
           Marker = Backbone.Model.extend({
           });
           
           /**
           * The Backbone.js view for a leaflet marker
           */
           MarkerView = Backbone.View.extend({
             initialize: function(opts) {
               this.map = opts.map;
               this.markerIcon = L.icon({
                                         iconUrl: '../lib/leaflet/images/marker-icon.png',
                                         shadowUrl: '../lib/leaflet/images/marker-shadow.png'
                                        });
               
               // All locations are at the very same location, so just use the lat/lon of the first element
               this.marker = L.marker([this.model.locations.at(0).get('lat'), this.model.locations.at(0).get('lon')], {icon: this.markerIcon});
               this.locationMarkerView = new LocationMakerView({model: {locations: this.model.locations, backend: this.model.backend}});
               this.featureGroup = L.featureGroup().addTo(this.map);
               
               _.bindAll(this, 'removeMarker')
             },
             render: function() {
               this.marker.addTo(this.featureGroup)
                          .bindPopup(this.locationMarkerView.el, {minWidth: 300});
             },
             removeMarker: function() {
               this.featureGroup.clearLayers();
             }
           });
           
           /**
           * The Backbone.js view for a leaflet map
           */
           MapView = Backbone.View.extend({
             id: 'map',
             initialize: function() {
               var thiz = this;
               
               var options = {
                 contextmenu: true,
                 contextmenuWidth: 180,
                 contextmenuItems: [{text: 'Add New Location Here',
                                     callback : this.model.backend.addLocation}]
               };
               var muenster = [51.962655, 7.625763];
               var zoom = 15;

               this.map = L.map(this.$el.attr('id'), options).setView(muenster, zoom);
               L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                 attribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                 maxZoom : 18
               }).addTo(this.map);
               
               this.featureGroup = L.featureGroup().addTo(this.map);
               
               this.map.on('contextmenu', function(e) {
                 this.coords = e.latlng;
                 JL('iPED Toolkit.Backend').debug('Click on map (' + this.coords + ')');
               });
               
               this.listenTo(this.model.locations, 'all', this.render);
             },
             render: function() {
               var thiz = this;
               var previousLocation = null;
               var previousMarkerView = null;
               
               this.featureGroup.clearLayers();
               this.markerViews = this.model.locations.map(function(location) {
                 var locations = new Locations();
                 
                 if (previousLocation && 
                    previousLocation.get('lat') == location.get('lat') && previousLocation.get('lon') == location.get('lon')) {
                      // There are two markers on top of each other (e.g., one location in two 'states').
                      // Clear the previous one and apply special treatment to the new one
                      previousMarkerView.removeMarker();
                      locations = previousMarkerView.model.locations;
                 }
                 locations.add(location);
                 var markerView = new MarkerView({model: {locations: locations, backend: thiz.model.backend}, map: thiz.featureGroup});
                 
                 previousLocation = location;
                 previousMarkerView = markerView;
                 return markerView.render();
               });
             }
           });
           
           /**
           * The Backbone.js model of a location
           */
           Location = Backbone.Model.extend({
             urlRoot: '/api/locations',
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
             url: '/api/locations',
             comparator: function(a, b) {
               // Morin: I just defined my very own naive metric here.
               // Does anyone with geoinformatics background have something better here?
               if (a.get('lat') + a.get('lon') < b.get('lat') + b.get('lon')) {
                 return -1;
               } else {
                 return 1;
               }
             }
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
                 var template = _.template(html, {locations: thiz.model.locations});
                 thiz.$el.html(template); 
                 thiz.$el.find('input[data-role=tagsinput]').tagsinput({tagClass: function(item) {return 'label label-default';}});
                 thiz.model.locations.each(function(location) {
                   _.each(location.get('tags'), function(tag) {
                     thiz.$el.find('input[data-role=tagsinput][data-location=' + location.get('id') + ']').tagsinput('add', tag);
                   });
                 });
               });
               return this;
             },
             events: {
               'click button.add': '_add',
               'click button.edit': '_edit',
               'click button.delete': '_delete'
             },
             _add: function(event) {
               var locationId = $(event.currentTarget).data('location');
               this.model.backend.addLocation({location: this.model.locations.get(locationId)});
             },
             _edit: function(event) {
               var locationId = $(event.currentTarget).data('location');
               this.model.backend.editLocation({location: this.model.locations.get(locationId)});
             },
             _delete: function(event) {
               var locationId = $(event.currentTarget).data('location');
               this.model.backend.deleteLocation({location: this.model.locations.get(locationId)});
             }
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
               this.$el.find('button').attr('disabled', 'disabled');
               this.model.backend.saveLocation({location: this.model.location, 
                                                attributes: form2js(this.$el.find('form')[0], '.', true),
                                                dialog: this.el});
             }
           });
           // ### </Backbone> ###
         
         
           /**
            * The backend of the iPED Toolkit.
            * @constructor
            */
           function Backend() {
             this.mapView = null;
             _.bindAll(this, 'addLocation');
             
             this.initMap();
           }
           
           /**
           * Initializes the leaflet map
           */
           Backend.prototype.initMap = function() {
             var thiz = this;
             
             this.locations = new Locations();
             this.locations.fetch({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Backend').debug('Init map with locations: ' + JSON.stringify(thiz.locations));
                 thiz.mapView = new MapView({model: {locations: thiz.locations, backend: thiz}});
                 thiz.mapView.render();
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
           Backend.prototype.addLocation = function(opts) {
             if (opts.location instanceof Backbone.Model) {
               JL('iPED Toolkit.Backend').debug('Add new location to existing location: ' + JSON.stringify(opts.location)); 
               this.mapView.map.closePopup();
               var newLocation = opts.location.clone();
               newLocation.unset('id');
               var locationEditView = new LocationEditView({model: {location: newLocation, backend: this}});
               $(locationEditView.el).dialog({title: 'Edit location',
                                              position: {my: 'right-20 top+20',
                                                         at: 'right top',
                                                         of: $('.container')[0]
                                                        }
                                              })
                                     .dialog('open');
             } else {
               JL('iPED Toolkit.Backend').debug('Add new location: ' + JSON.stringify(opts));
               var newLocation = new Location();
               newLocation.set('lat', opts.latlng.lat);
               newLocation.set('lon', opts.latlng.lng);
               var locationEditView = new LocationEditView({model: {location: newLocation, backend: this}});
               $(locationEditView.el).dialog({title: 'Edit location',
                                              position: {my: 'right-20 top+20',
                                                         at: 'right top',
                                                         of: $('.container')[0]
                                                        }
                                              })
                                     .dialog('open');
             }
           }
           
           /**
           * Edit an existing location
           * @param location - The location to be edited
           */
           Backend.prototype.editLocation = function(opts) {
             JL('iPED Toolkit.Backend').debug('Edit location: ' + JSON.stringify(opts.location));
             this.mapView.map.closePopup();
             var locationEditView = new LocationEditView({model: {location: opts.location, backend: this}});
             $(locationEditView.el).dialog({title: 'Edit location',
                                            position: {my: 'right-20 top+20',
                                                       at: 'right top',
                                                       of: $('.container')[0]
                                                      }
                                            })
                                   .dialog('open');
           }
           
           /**
           * Delete a location
           * @param location - The location to be deleted
           */
           Backend.prototype.deleteLocation = function(opts) {
             JL('iPED Toolkit.Backend').debug('About to delete location: ' + JSON.stringify(location));
             var thiz = this;
             
             opts.location.destroy({
               success: function(model, response, options) {
                 thiz.mapView.map.closePopup();
               },
               error: function(model, response, options) {
                 alert(JSON.stringify(response));
               }
             })
           }
           
           /**
           * Save a location by pushing it the the server
           * @param location - The location to be saved
           * @param attributes - The set of (changed) attributes
           */
           Backend.prototype.saveLocation = function(opts) {
             JL('iPED Toolkit.Backend').debug('Save location: ' + JSON.stringify(opts.location) + ', with new attributes: ' + JSON.stringify(opts.attributes)); 
             var thiz = this;
             
             opts.location.save(opts.attributes, {
               success: function(model, response, options) {
                 $(opts.dialog).dialog('close');
                 thiz.locations.fetch(); // Refresh collection (alternative: thiz.locations.add(model);)
               },
               error: function(model, response, options) {
                 $(opts.dialog).find('button').removeAttr('disabled');
                 alert(JSON.stringify(response));
               }
             });             
           }
           
           $(document).ready(function() {
             var backend = new Backend();
           });
         }
);
