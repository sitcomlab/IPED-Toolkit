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
         * The Backbone.js model of an overlay
         */
        Overlay = Backbone.Model.extend({
            urlRoot: '/api/overlays',
            initialize: function() {}
        });

        return Overlay;
    }
);
