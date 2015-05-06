/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp, Nicholas Schiestel
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
                /*,
                            defaults: {
                                // According to API specification 24.04.2015
                                name: '',
                                description: '',
                                tags: [],
                                url: '',
                                date: ''
                            }*/
        });

        return Video;
    }
);
