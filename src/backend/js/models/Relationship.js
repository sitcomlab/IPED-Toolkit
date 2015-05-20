/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2015 Tobias Brüggentisch, Morin Ostkamp, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone'],
    function(Backbone) {
        /**
         * The Backbone.js model of a Relationship between a location and a related location
         */
        Relationship = Backbone.Model.extend({
            initialize: function() {},
        });

        return Relationship;
    }
);
