/*!
* The iPED Toolkit
* Backend
*
* (c) 2014 Tobias Brüggentisch, Morin Ostkamp
* Institute for Geoinformatics (ifgi), University of Münster
*/

require.config(requireConfig);

var TPL_PATH = 'requirejs/js/text!../backend/templates/';

require(['jsnlog/js/jsnlog.min',
         'jquery/js/jquery.min',
         'jquery/js/jquery-ui.min',
         'bootstrap/js/bootstrap.min',
         'bootstrap/js/bootstrap-tagsinput.min',
         'underscorejs/js/underscore',
         'backbonejs/js/backbone',
         'leaflet/js/leaflet',
         'leaflet/js/leaflet.contextmenu',
         'form2js/js/form2js',
         // Models
         'backend/models/Location',
         'backend/models/Locations',
         'backend/models/Video',
         'backend/models/Videos',
         'backend/models/Overlay',
         'backend/models/Overlays',
         // Views
         'backend/views/MapView',
         'backend/views/MarkerView',
         'backend/views/LocationMarkerView',
         'backend/views/LocationEditView',
         'backend/views/OverlayEditView'
         ],
         
         function(JSNLog, JQuery, JQueryUI, Bootstrap, BootstrapTagsinput, Underscore, Backbone, Leaflet, LeafletContextmenu, form2js,
                  Location, Locations, Video, Videos, Overlay, Overlays,
                  MapView, MarkerView, LocationMarkerView, LocationEditView, OverlayEditView) {
           
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
         
           /**
            * The backend of the iPED Toolkit.
            * @constructor
            */
           function Backend() {
             var thiz = this;
             
             this.mapView = null;
             this.locationEditViews = [];
             _.bindAll(this, 'addLocation');
               
             this.fetchLocations({callback: function() {
               thiz.initMap();
             }});
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
               this.locationEditViews.push(locationEditView);
               this.showEditLocationDialog({content: locationEditView.el});
             } else {
               JL('iPED Toolkit.Backend').debug('Add new location: ' + JSON.stringify(opts));
               var newLocation = new Location();
               newLocation.set('lat', opts.latlng.lat);
               newLocation.set('lon', opts.latlng.lng);
               var locationEditView = new LocationEditView({model: {location: newLocation, backend: this, title: 'Add new location'}});
               this.locationEditViews.push(locationEditView);
               this.showEditLocationDialog({content: locationEditView.el});
             }
           };
           
           /**
           * Edit an existing location
           * @param location - The location to be edited
           */
           Backend.prototype.editLocation = function(opts) {
             JL('iPED Toolkit.Backend').debug('Edit location: ' + JSON.stringify(opts.location));
             this.mapView.map.closePopup();
             var locationEditView = new LocationEditView({model: {location: opts.location, backend: this, title: 'Edit location'}});
             this.locationEditViews.push(locationEditView);
             this.showEditLocationDialog({content: locationEditView.el});
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
                 opts.dialog._close();
                 thiz.locations.fetch(); // Refresh collection (alternative: thiz.locations.add(model);)
               },
               error: function(model, response, options) {
                 opts.dialog._enableButtons();
                 alert(JSON.stringify(response));
               }
             });             
           };
           
           /**
           * Delete a location
           * @param location - The location to be deleted
           */
           Backend.prototype.deleteLocation = function(opts) {
             JL('iPED Toolkit.Backend').debug('About to delete location: ' + JSON.stringify(opts.location));
             var thiz = this;
             
             opts.location.destroy({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Backend').debug('Location ' + opts.location.get('id') + ' deleted');
                 thiz.mapView.map.closePopup();
               },
               error: function(model, response, options) {
                 alert(JSON.stringify(response));
               }
             })
           };
           
           /**
           * Opens a new view/frame that lets the user position a new overlay on top the video
           */
           Backend.prototype.addOverlay = function(opts) {
             var thiz = this;
             
             JL('iPED Toolkit.Backend').debug('Add new overlay');
             var newOverlay = new Overlay({name: '',
                                           description: '',
                                           tags: [],
                                           type: 'image',
                                           url: window.location.origin + window.location.pathname + 'images/testimage.jpg',
                                           w: 800,
                                           h: 600,
                                           x: 100,
                                           y: 0,
                                           z: 0,
                                           d: 0,
                                           rx: 0,
                                           ry: 0,
                                           rz: 0});
             var overlayEditView = new OverlayEditView({model: {video: opts.video, overlay: newOverlay, backend: this, title: 'Add overlay'}});
             this.showEditOverlayDialog({content: overlayEditView.el});
           };
           
           /**
           * Edit an existing overlay
           * @param video - The video behind the overlay
           * @param overlay - The overlay to be edited
           */
           Backend.prototype.editOverlay = function(opts) {
             JL('iPED Toolkit.Backend').debug('Edit overlay: ' + JSON.stringify(opts.overlay));
             var overlayEditView = new OverlayEditView({model: {video: opts.video, overlay: opts.overlay, backend: this, title: 'Edit overlay'}});
             this.showEditOverlayDialog({content: overlayEditView.el});
           };
           
           /**
           * Saves overlay created by addOverlay to the database
           */
           Backend.prototype.saveOverlay = function(opts) {
             var thiz = this;
             
             JL('iPED Toolkit.Backend').debug('Save overlay: ' + JSON.stringify(opts.overlay) + ', with new attributes: ' + JSON.stringify(opts.attributes));  
             opts.overlay.save(opts.attributes, {
               success: function(model, response, options) {
                 opts.dialog._close();
                 thiz.locationEditViews.forEach(function(locationEditView) {
                   locationEditView.update();
                 });
               },
               error: function(model, response, options) {
                 opts.dialog._enableButtons();
                 alert(JSON.stringify(response));
               }
             }); 
           };
           
           /**
           * Delete an overlay
           * @param overlay - The overlay to be deleted
           */
           Backend.prototype.deleteOverlay = function(opts) {
             JL('iPED Toolkit.Backend').debug('About to delete overlay: ' + JSON.stringify(opts.overlay));
             var thiz = this;
             
             opts.overlay.destroy({
               success: function(model, response, options) {
                 JL('iPED Toolkit.Backend').debug('Overlay ' + opts.overlay.get('id') + ' deleted');
                 thiz.locationEditViews.forEach(function(locationEditView) {
                   locationEditView.update();
                 });
               },
               error: function(model, response, options) {
                 alert(JSON.stringify(response));
               }
             })
           };
           
           /**
           * Shows a customized JQuery dialog to add/edit locations
           */
           Backend.prototype.showEditLocationDialog = function(opts) {
             $(opts.content).dialog({dialogClass: 'ui-dialog-titlebar-hidden overflow-y',
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
           * Shows a customized JQuery dialog to add/edit locations
           */
           Backend.prototype.showEditOverlayDialog = function(opts) {
             $(opts.content).dialog({dialogClass: 'ui-dialog-titlebar-hidden overflow-hidden',
                                    width: '90%',
                                    resizable: false,
                                    draggable: false,
                                    position: {my: 'top+20',
                                               at: 'top',
                                               of: $('.container')[0]
                                               }
                                    })
                                    .dialog('open')
                                    .parent().draggable();
           };
           
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
             json = json.replace('null', '');
             return JSON.parse(json);
           };
           
           $(document).ready(function() {
             var backend = new Backend();
           });
         }
);
