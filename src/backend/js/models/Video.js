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
         * The Backbone.js model of a video
         */
        Video = Backbone.Model.extend({
            urlRoot: '/api/videos',
            initialize: function() {}
        });

        return Video;
    }
);
