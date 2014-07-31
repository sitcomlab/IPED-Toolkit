define(['backbonejs/js/backbone',
        'backend/models/Overlay'],
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