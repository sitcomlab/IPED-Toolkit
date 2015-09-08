/*!
 * The IPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Location'
    ],
    function(Backbone) {
        /**
         * The backbone.js collection for locations
         */
        Locations = Backbone.Collection.extend({
            model: Location,
            url: '/api/locations',
            comparator: function(a, b) {
                // Morin: I just defined my very own naive metric here.
                // Does anyone with geoinformatics background have something better here?
                if (a.get('lat') + a.get('lon') < b.get('lat') + b.get('lon')) {
                    return -1;
                } else {
                    return 1;
                }
            }
        });

        return Locations;
    }
);
