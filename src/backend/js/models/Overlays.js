/*!
 * The IPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Overlay'
    ],
    function(Backbone) {
        /**
         * The backbone.js collection for overlays
         */
        Overlays = Backbone.Collection.extend({
            model: Overlay,
            url: '/api/overlays'
        });

        return Overlays;
    }
);
