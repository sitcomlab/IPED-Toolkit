define(['backbonejs/js/backbone',
        'backend/models/Video'],
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