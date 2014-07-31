define(['backbonejs/js/backbone'],
  function(Backbone) {
    /**
    * The Backbone.js model of an overlay
    */
    Overlay = Backbone.Model.extend({
      urlRoot: '/api/overlays',
      initialize: function() {
        _.bindAll(this, 'fetch');
      }
    });
    
    return Overlay;
  }
);