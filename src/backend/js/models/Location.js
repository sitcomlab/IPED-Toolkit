define(['backbonejs/js/backbone'],
  function(Backbone) {
    /**
    * The Backbone.js model of a location
    */
    Location = Backbone.Model.extend({
      urlRoot: '/api/locations',
      initialize: function() {
        _.bindAll(this, 'fetch');
      },
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