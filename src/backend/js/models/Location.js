/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone'],
    function(Backbone) {
        /**
         * The Backbone.js model of a location
         */
        Location = Backbone.Model.extend({
            urlRoot: '/api/locations',
            initialize: function() {},
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

        return Location;
    }
);
