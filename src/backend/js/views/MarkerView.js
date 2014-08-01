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
        'leaflet/js/leaflet.awesome-markers.min'
    ],
    function(Backbone, LocationMarkerView, Bootstrap, LeafletAwesomeMarker) {
        /**
         * The Backbone.js view for a leaflet marker
         */
        MarkerView = Backbone.View.extend({
            initialize: function(opts) {
                var thiz = this;

                this.map = opts.map;
                this.normalMarkerIcon = L.AwesomeMarkers.icon({
                    // See http://getbootstrap.com/components/#glyphicons-glyphs
                    icon: '',
                    markerColor: 'blue'
                });
                this.createRouteFromMarkerIcon = L.AwesomeMarkers.icon({
                    // See http://getbootstrap.com/components/#glyphicons-glyphs
                    icon: 'arrow-up',
                    markerColor: 'red'
                });
                this.createRouteToMarkerIcon = L.AwesomeMarkers.icon({
                    // See http://getbootstrap.com/components/#glyphicons-glyphs
                    icon: 'arrow-down',
                    markerColor: 'red'
                });

                // All locations are at the very same location, so just use the lat/lon of the first element
                this.marker = L.marker([this.model.locations.at(0)
                    .get('lat'), this.model.locations.at(0)
                    .get('lon')
                ], {
                    icon: this.normalMarkerIcon,
                    contextmenu: true,
                    contextmenuInheritItems: false,
                    contextmenuItems: [{
                        index: 0,
                        text: 'Create new route',
                        disabled: true
                    }, {
                        index: 1,
                        separator: true
                    }, {
                        index: 2,
                        text: '<span class="glyphicon glyphicon-arrow-up"></span> From here…',
                        context: this,
                        callback: function(event) {
                            thiz.marker.setIcon(thiz.createRouteFromMarkerIcon);
                            thiz.model.backend.createRouteFrom({
                                locations: thiz.model.locations,
                                marker: thiz.marker
                            });
                        }
                    }, {
                        index: 3,
                        text: '<span class="glyphicon glyphicon-arrow-down"></span> …to there',
                        context: this,
                        callback: function() {
                            thiz.marker.setIcon(thiz.createRouteToMarkerIcon);
                            thiz.model.backend.createRouteTo({
                                locations: thiz.model.locations,
                                marker: thiz.marker
                            });
                        }
                    }]
                });
                this.marker.markerView = this;
                this.locationMarkerView = new LocationMarkerView({
                    model: {
                        backend: this.model.backend,
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
