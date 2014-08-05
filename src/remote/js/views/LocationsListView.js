/*!
 * The iPED Toolkit
 * Remote
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Location',
        'backend/models/Locations'
    ],
    function(Backbone, Location, Locations) {
        /**
         * The Backbone.js view for a list of locations (used in Remote)
         */
        LocationsListView = Backbone.View.extend({
            initialize: function(opts) {
                var thiz = this;
                this.remote = opts.remote;

                this.listenTo(this.model, 'add', this.render);
                this.listenTo(this.model, 'remove', this.render);

                this.render();
            },
            render: function() {
                var thiz = this;
                require([TPL_PATH + 'locationsListView.tpl'], function(html) {
                    var template = _.template(html, {
                        locations: thiz.model
                    });
                    thiz.$el.html(template);
                });

                return this;
            },
            events: {
                'click button.location': 'setLocationId'
            },
            setLocationId: function(event) {
                var locationId = $(event.target)
                    .data('location');
                this.remote.setLocationId(locationId);
            }
        });

        return LocationsListView;
    }
);
