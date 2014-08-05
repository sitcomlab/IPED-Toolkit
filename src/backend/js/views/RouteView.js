/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'leaflet/js/leaflet'
    ],
    function(Backbone, Leaflet) {
        /**
         * The Backbone.js view for a route between two locations (a leaflet polyline)
         */
        RouteView = Backbone.View.extend({
            initialize: function(opts) {
                this.featureGroup = opts.featureGroup;
                this.backend = opts.backend;
                this.polyline = null;
                this.routes = [];
                this.fromPoint = opts.fromPoint;
                this.toPoint = opts.toPoint;
            },
            render: function() {
                var thiz = this;

                if (this.routes == null ||
                    this.routes.length == 0) {
                    return;
                }

                JL('iPED Toolkit.RouteView')
                    .debug('Draw/Update route: ' + JSON.stringify(this.fromPoint) + ' <-> ' + JSON.stringify(this.toPoint));

                var contextMenuItems = [{
                    index: 0,
                    text: 'Delete route',
                    disabled: true
                }, {
                    index: 1,
                    separator: true
                }];
                this.routes.forEach(function(route) {
                    contextMenuItems.push({
                        text: '<span class="glyphicon glyphicon-trash"></span> ' + route[0].get('name') + ' -> ' + route[1].get('name'),
                        callback: function(event) {
                            thiz.backend.deleteRoute({
                                fromLocation: route[0],
                                toLocation: route[1]
                            });
                        }
                    });
                });

                this.featureGroup.clearLayers();
                this.polyline = L.polyline([this.fromPoint, this.toPoint], {
                    color: 'blue',
                    contextmenu: true,
                    contextmenuInheritItems: false,
                    contextmenuItems: contextMenuItems
                })
                    .addTo(this.featureGroup);
            }
        });

        return RouteView;
    }
);
