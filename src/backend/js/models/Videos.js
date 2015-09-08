/*!
 * The IPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Video'
    ],
    function(Backbone) {
        /**
         * The backbone.js collection for videos
         */
        Videos = Backbone.Collection.extend({
            model: Video,
            url: '/api/videos'
        });

        return Videos;
    }
);
