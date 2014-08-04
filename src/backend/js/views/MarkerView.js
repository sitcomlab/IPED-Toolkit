/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/views/LocationMarkerView',
        'bootstrap/js/bootstrap.min',
        'leaflet/js/leaflet',
        'leaflet/js/leaflet.awesome-markers.min'
    ],
    function(Backbone, LocationMarkerView, Bootstrap, Leaflet, LeafletAwesomeMarker) {
        /**
         * The Backbone.js view for a leaflet marker
         */
        MarkerView = Backbone.View.extend({
            initialize: function(opts) {
                var thiz = this;

                this.backend = opts.backend;
                this.map = opts.map;
                this.normalMarkerIcon = L.AwesomeMarkers.icon({
                    // See http://getbootstrap.com/components/#glyphicons-glyphs
                    icon: '',
                    markerColor: 'blue'
                });
                this.createRouteFromMarkerIcon = L.AwesomeMarkers.icon({
                    // See http://getbootstrap.com/components/#glyphicons-glyphs
                    icon: 'arrow-up',
                    markerColor: 'blue'
                });
                this.createRouteToMarkerIcon = L.AwesomeMarkers.icon({
                    // See http://getbootstrap.com/components/#glyphicons-glyphs
                    icon: 'arrow-down',
                    markerColor: 'blue'
                });

                var contextMenuItems = [{
                    text: 'Create new route',
                    disabled: true
                }, {
                    separator: true
                }, {
                    text: '… from …',
                    disabled: true
                }];
                this.model.locations.forEach(function(location) {
                    contextMenuItems.push({
                        text: '<span class="glyphicon glyphicon-arrow-up"></span> ' + location.get('name'),
                        callback: function(event) {
                            thiz.backend.createRouteFrom({
                                location: location,
                                marker: thiz.marker
                            });
                        }
                    });
                });
                contextMenuItems.push({
                    separator: true
                });
                contextMenuItems.push({
                    text: '… to …',
                    disabled: true
                });
                this.model.locations.forEach(function(location) {
                    contextMenuItems.push({
                        text: '<span class="glyphicon glyphicon-arrow-down"></span> ' + location.get('name'),
                        callback: function(event) {
                            thiz.backend.createRouteTo({
                                location: location,
                                marker: thiz.marker
                            });
                        }
                    });
                });

                // All locations are at the very same location, so just use the lat/lon of the first element
                this.marker = L.marker([this.model.locations.at(0)
                    .get('lat'), this.model.locations.at(0)
                    .get('lon')
                ], {
                    icon: this.normalMarkerIcon,
                    contextmenu: true,
                    contextmenuInheritItems: false,
                    contextmenuItems: contextMenuItems
                });
                this.marker.markerView = this;
                this.locationMarkerView = new LocationMarkerView({
                    backend: this.backend,
                    model: {
                        locations: this.model.locations
                    }
                });
                this.featureGroup = L.featureGroup()
                    .addTo(this.map);
            },
            render: function() {
                this.marker.addTo(this.featureGroup)
                    .bindPopup(this.locationMarkerView.el, {
                        minWidth: 300
                    });
            },
            removeMarker: function() {
                this.featureGroup.clearLayers();
            }
        });

        return MarkerView;
    }
);
