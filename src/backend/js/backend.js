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
           * The Backbone.js view for a leaflet map
           */
           MapView = Backbone.View.extend({
             id: 'map',
             initialize: function() {
               var thiz = this;
               
               var options = {
                 contextmenu: true,
                 contextmenuWidth: 180,
                 contextmenuItems: [{text: 'Add new location',
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
               
               this.map.on('popupopen', function(event) {
                 var locationMarkerView = event.popup._source.markerView.locationMarkerView;
                 locationMarkerView.fetch();
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
                 var markerView = new MarkerView({model: {backend: thiz.model.backend,
                                                          locations: locations},
                                                          map: thiz.featureGroup});
                 
                 previousLocation = location;
                 previousMarkerView = markerView;
                 return markerView.render();
               });
             }
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
               this.marker = L.marker([this.model.locations.at(0).get('lat'), this.model.locations.at(0).get('lon')],
                                      {icon: this.markerIcon});
               this.marker.markerView = this;
               this.locationMarkerView = new LocationMakerView({model: {backend: this.model.backend,
                                                                        locations: this.model.locations}});
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
           * The backbone.js view for a leaflet marker
           */
           LocationMakerView = Backbone.View.extend({
             initialize: function() {
               this.isFetched = false;
               this.render();
             },
             render: function() {
               var thiz = this;
               
               require([TPL_PATH+'locationMarkerView.tpl'], function (html) {
                 var template = _.template(html, {locations: thiz.model.locations});
                 thiz.$el.html(template); 
                 thiz.$el.find('input[data-role=tagsinput]').tagsinput({tagClass: function(item) {return 'label label-default';}});
                 thiz.model.locations.forEach(function(location) {
                   location.get('tags').forEach(function(tag) {
                     thiz.$el.find('input[data-role=tagsinput][data-location=' + location.get('id') + ']').tagsinput('add', tag);
                   });
                 });
               });
               return this;
             },
             fetch: function() {
               var thiz = this;
               
               if (this.isFetched == true) {
                 return;
               }
               
               JL('iPED Toolkit.Backend').debug('Updating the LocationMarkerView');
               this.model.locations.forEach(function(location) {
                 if (location.get('videos').length == 0) {
                   thiz.$el.find('.videos[data-location=' + location.get('id') + ']').html('None');
                 }
                 location.get('videos').forEach(function(videoId) {
                   var video = new Video({id: videoId});
                   video.fetch({
                    success: function(model, response, options) {
                      thiz.$el.find('.videos[data-location=' + location.get('id') + '] .spinner').remove();
                      thiz.$el.find('.videos[data-location=' + location.get('id') + ']').html(thiz.$el.find('.videos').html() + 
                                                                                              '<span>' + model.get('name') + ' (' + model.get('description') + ')' + '</span>');
                    },
                    error: function(model, response, options) {
                      JL('iPED Toolkit.Backend').error(response);
                    }
                   });
                 });
                 
                 if (location.get('overlays').length == 0) {
                   thiz.$el.find('.overlays[data-location=' + location.get('id') + ']').html('None');
                 }
                 location.get('overlays').forEach(function(overlayId) {
                   var overlay = new Overlay({id: overlayId});
                   overlay.fetch({
                    success: function(model, response, options) {
                      thiz.$el.find('.overlays[data-location=' + location.get('id') + '] .spinner').remove();
                      thiz.$el.find('.overlays[data-location=' + location.get('id') + ']').html(thiz.$el.find('.overlays').html() + 
                                                                                                '<span>' + model.get('name') + ' (' + model.get('description') + ')' + '</span>');
                    },
                    error: function(model, response, options) {
                      JL('iPED Toolkit.Backend').error(response);
                    }
                   });
                 });
               });
               this.isFetched = true;
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
           * The backbone.js view used for editing a location
           */
           LocationEditView = Backbone.View.extend({
             initialize: function() {
               this.isFetched = false;
               this.render();
             },
             render: function() {
               var thiz = this;
               require([TPL_PATH+'locationEditView.tpl'], function (html) {
                 var template = _.template(html, {location: thiz.model.location, title: thiz.model.title});
                 thiz.$el.html(template);
                 thiz.$el.find('select[data-role=tagsinput]').tagsinput({tagClass: function(item) {return 'label label-primary';}});
                 thiz.model.location.get('tags').forEach(function(tag) {
                   thiz.$el.find('select[data-role=tagsinput]').tagsinput('add', tag);
                 });
                 thiz.fetch();
               });
               return this;
             },
             fetch: function() {
               var thiz = this;
               
               if (this.isFetched == true) {
                 return;
               }
               
               JL('iPED Toolkit.Backend').debug('Updating the LocationEditView');
               var videos = new Videos();
               videos.fetch({
                 success: function(model, response, options) {
                   model.forEach(function(video) {
                     var selected = '';
                     if (_.contains(thiz.model.location.get('videos'), video.get('id'))) {
                       selected = 'selected';
                     }
                     thiz.$el.find('.videos').append('<option value="' + video.get('id') + '" ' + selected + '>' + video.get('name') + '</option>');
                   });
                 },
                 error: function(model, response, options) {
                   JL('iPED Toolkit.Backend').error(response);
                 }
               });
               
               var overlays = new Overlays();
               overlays.fetch({
                 success: function(model, response, options) {
                   model.forEach(function(overlay) {
                     var selected = '';
                     if (_.contains(thiz.model.location.get('overlays'), overlay.get('id'))) {
                       selected = 'selected';
                     }
                     thiz.$el.find('.overlays').append('<option value="' + overlay.get('id') + '" ' + selected + '>' + overlay.get('name') + '</option>');
                   });
                 },
                 error: function(model, response, options) {
                   JL('iPED Toolkit.Backend').error(response);
                 }
               });
               
               this.isFetched = true;
             },
             events:
             {
               'click button.close': '_close',
               'click button.save': '_save',
               'click button.add-overlay': '_addOverlay'
             },
             _close: function() {
               $(this.el).dialog('destroy');
             },
             _save: function() {
               this.$el.find('button').attr('disabled', 'disabled');
               this.model.backend.saveLocation({location: this.model.location, 
                                                attributes: this.model.backend.form2js(this.$el.find('form')[0], '.', true),
                                                dialog: this.el});
             },
             _addOverlay: function() {
               if (this.$el.find('.videos :selected').text() == "None") {
                 this.$el.find('.videos').parentsUntil('div.form-group').addClass('has-error');
                 alert('Please select a video footage first.');
                 return;
               }
               this.$el.find('.videos').parentsUntil('div.form-group').removeClass('has-error');
               this.model.backend.addOverlay({location: this.model.location});
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
           * The backbone.js collection for videos
           */
           Videos = Backbone.Collection.extend({
             model: Video,
             url: '/api/videos'
           });
           
           /**
           * The Backbone.js model of an overlay
           */
           Overlay = Backbone.Model.extend({
             urlRoot: '/api/overlays',
             initialize: function() {
               _.bindAll(this, 'fetch');
             }
           });
           
           /**
           * The backbone.js collection for overlays
           */
           Overlays = Backbone.Collection.extend({
             model: Overlay,
             url: '/api/overlays'
           });
           // ### </Backbone> ###
         
         
           /**
            * The backend of the iPED Toolkit.
            * @constructor
            */
           function Backend() {
             var thiz = this;
             
             this.mapView = null;
             _.bindAll(this, 'addLocation');
             
             /*this.fetchAll({callback: function() {
               thiz.initMap();
             }});
             */
               
             this.fetchLocations({callback: function() {
               thiz.initMap();
             }});
           }
           
           /**
           * Fetches all collections from the server and prepares them for use in the backend
           */
           Backend.prototype.fetchAll = function(opts) {
             var thiz = this;
             
             thiz.fetchLocations({callback: function() {
               thiz.fetchVideos({callback: function() {
                 thiz.fetchOverlays({callback: function() {
                   if (opts && opts.callback) {
                    opts.callback(opts.params);
                   }
                   JL('iPED Toolkit.Backend').debug('Done fetching all collections'); 
                 }});
               }});
             }});
           };
           
           /**
           * Fetches all locations from the server and prepares them for use in the backend
           */
           Backend.prototype.fetchLocations = function(opts) {
             var thiz = this;
             
             this.locations = new Locations();
             this.locations.fetch({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Backend').debug(thiz.locations);
                 opts.callback(opts.params);
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Backend').error(respone); 
               } 
             });
           };
           
           /**
           * Fetches all videos from the server and prepares them for use in the backend
           */
           Backend.prototype.fetchVideos = function(opts) {
             var thiz = this;
             
             this.videos = new Videos();
             this.videos.fetch({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Backend').debug(thiz.videos);
                 opts.callback(opts.params);
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Backend').error(respone); 
               } 
             });
           };
           
           /**
           * Fetches all overlays from the server and prepares them for use in the backend
           */
           Backend.prototype.fetchOverlays = function(opts) {
             var thiz = this;
             
             this.overlays = new Overlays();
             this.overlays.fetch({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Backend').debug(thiz.overlays);
                 opts.callback(opts.params);
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Backend').error(respone); 
               } 
             });
           };
           
           /**
           * Initializes the leaflet map
           */
           Backend.prototype.initMap = function() {
             JL('iPED Toolkit.Backend').debug('Init map with locations: ' + JSON.stringify(this.locations));
             this.mapView = new MapView({model: {backend: this,
                                                 locations: this.locations}});
             this.mapView.render();
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
               var locationEditView = new LocationEditView({model: {location: newLocation, backend: this, title: 'Add state'}});
               this.showEditLocationDialog({content: locationEditView.el});
             } else {
               JL('iPED Toolkit.Backend').debug('Add new location: ' + JSON.stringify(opts));
               var newLocation = new Location();
               newLocation.set('lat', opts.latlng.lat);
               newLocation.set('lon', opts.latlng.lng);
               var locationEditView = new LocationEditView({model: {location: newLocation, backend: this, title: 'Add new location'}});
               this.showEditLocationDialog({content: locationEditView.el});
             }
           }
           
           /**
           * Edit an existing location
           * @param location - The location to be edited
           */
           Backend.prototype.editLocation = function(opts) {
             JL('iPED Toolkit.Backend').debug('Edit location: ' + JSON.stringify(opts.location));
             this.mapView.map.closePopup();
             var locationEditView = new LocationEditView({model: {location: opts.location, backend: this, title: 'Edit location'}});
             this.showEditLocationDialog({content: locationEditView.el});
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
           * Converts form data into a JSON object
           * (Basically uses form2js.js and applies special number treatment.)
           * (Morin's notes: /"[^{},:]*"/g)
           */
           Backend.prototype.form2js = function(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName) {
             var json = JSON.stringify(form2js(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName));
             json = json.replace(/"[-0-9]*"/g, function(match, capture) {
               return parseInt(match.replace(/"/g, ''), 10);
             });
             json = json.replace('-1', '');
             return JSON.parse(json);
           };
           
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
                 $(opts.dialog).dialog('destroy');
                 thiz.locations.fetch(); // Refresh collection (alternative: thiz.locations.add(model);)
               },
               error: function(model, response, options) {
                 $(opts.dialog).find('button').removeAttr('disabled');
                 alert(JSON.stringify(response));
               }
             });             
           }
           
           /**
           * Shows a customized JQuery dialog
           */
           Backend.prototype.showEditLocationDialog = function(opts) {
             $(opts.content).dialog({dialogClass: 'ui-dialog-titlebar-hidden',
                                     height: 600,
                                     draggable: false,
                                     position: {my: 'right-20 top+20',
                                                at: 'right top',
                                                of: $('.container')[0]
                                                }
                                    })
                                   .dialog('open')
                                   .parent().draggable();
           };
           
           /**
           * Opens a new view/frame that lets the user position a new overlay on top the video
           */
           Backend.prototype.addOverlay = function(opts) {
             var thiz = this;
             var overlayPlugin = null;
             
             JL('iPED Toolkit.Backend').debug('Add new overlay');
             
             var video = new Video({id: opts.location.get('videos')[0]});
             video.fetch({
               success: function(model, response, options) {
                 require([TPL_PATH+'addOverlay.tpl', '../frontend/js/overlayPlugin'], function (html, OverlayPlugin) {
                   var template = _.template(html, {video: model});
                   var dialog = $(template).dialog({dialogClass: 'ui-dialog-titlebar-hidden',
                                                    width: '90%',
                                                    draggable: false});
                  dialog.dialog('open')
                        .parent().draggable();
                        
                   dialog.find('.close').on('click', function(event) {
                     dialog.dialog('destroy');
                     overlayPlugin.stop();
                     overlayPlugin = null;
                   });

                   var newOverlay = new Overlay({name: 'New overlay',
                                                 type: 'image',
                                                 url: window.location.href + 'images/testimage.jpg',
                                                 x: 100,
                                                 y: 0,
                                                 z: 0,
                                                 rx: 0,
                                                 ry: 0,
                                                 rz: 0,
                                                 w: 800,
                                                 h: 600,
                                                 d: 0});
                   var newOverlays = new Overlays();
                   newOverlays.add(newOverlay);
                   
                   overlayPlugin = new OverlayPlugin({parent: thiz, overlays: newOverlays, showUI: true});
                 });
               },
               error: function(model, response, options) {
                 JL('iPED Toolkit.Backend').error(response);
               }
             });
           };
           
           $(document).ready(function() {
             var backend = new Backend();
           });
         }
);
