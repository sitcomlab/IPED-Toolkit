define(['backbonejs/js/backbone'],
  function(Backbone) {
    /**
    * The Backbone.js model of a video
    */
    Video = Backbone.Model.extend({
      urlRoot: '/api/videos',
      initialize: function() {
        _.bindAll(this, 'fetch');
      }
    });
    
    return Video;
  }
);