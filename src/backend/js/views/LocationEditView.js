define(['backbonejs/js/backbone',
        'backend/models/Overlays',
        'backend/models/Videos'],
  function(Backbone) {
    /**
    * The backbone.js view used for editing a location
    */
    LocationEditView = Backbone.View.extend({
      initialize: function() {
        this.isFetched = false;
        this.videos = null;
        this.overlays = null;
        this.render();
      },
      render: function() {
        var thiz = this;
        require([TPL_PATH+'locationEditView.tpl'], function (html) {
          var template = _.template(html, {location: thiz.model.location, title: thiz.model.title});
          thiz.$el.html(template);
          thiz.$el.find('select[data-role=tagsinput]').tagsinput({tagClass: function(item) {return 'label label-primary';}});
          thiz.model.location.get('tags').forEach(function(tag) {
            thiz.$el.find('select[data-role=tagsinput]').tagsinput('add', tag);
          });
          thiz.fetch();
        });
        return this;
      },
      update: function() {
        this.isFetched = false;
        this.render();
      },
      fetch: function() {
        var thiz = this;
        
        if (this.isFetched == true) {
          return;
        }
        
        JL('iPED Toolkit.Backend').debug('Updating the LocationEditView');
        this.videos = new Videos();
        this.videos.fetch({
          success: function(model, response, options) {
            thiz.$el.find('.videos').empty();
            model.forEach(function(video) {
              var selected = '';
              if (_.contains(thiz.model.location.get('videos'), video.get('id'))) {
                selected = 'selected';
              }
              thiz.$el.find('.videos').append('<option value="' + video.get('id') + '" ' + selected + '>' + video.get('name') + '</option>');
            });
          },
          error: function(model, response, options) {
            JL('iPED Toolkit.Backend').error(response);
          }
        });
        
        this.overlays = new Overlays();
        this.overlays.fetch({
          success: function(model, response, options) {
            thiz.$el.find('.overlays').empty();
            model.forEach(function(overlay) {
              var selected = '';
              if (_.contains(thiz.model.location.get('overlays'), overlay.get('id'))) {
                selected = 'selected';
              }
              thiz.$el.find('.overlays').append('<option value="' + overlay.get('id') + '" ' + selected + '>' + overlay.get('name') + '</option>');
            });
          },
          error: function(model, response, options) {
            JL('iPED Toolkit.Backend').error(response);
          }
        });
        
        this.isFetched = true;
      },
      events:
      {
        'click button.close': '_close',
        'click button.save': '_save',
        'click button.add-overlay': '_addOverlay',
        'click button.edit-overlay': '_editOverlay',
        'click button.delete-overlay': '_deleteOverlay'
      },
      _disableButtons: function() {
        this.$el.find('button').attr('disabled', 'disabled');
      },
      _enableButtons: function() {
        this.$el.find('button').removeAttr('disabled');
      },
      _close: function() {
        $(this.el).dialog('destroy');
      },
      _save: function() {
        this._disableButtons();
        this.model.backend.saveLocation({location: this.model.location, 
                                         attributes: this.model.backend.form2js(this.$el.find('form')[0], '.', true),
                                         dialog: this});
      },
      _addOverlay: function() {
        if (this.$el.find('.videos :selected').attr('value') == -1) {
          this.$el.find('.videos').parentsUntil('div.form-group').addClass('has-error');
          alert('Please select a video footage first.');
          return;
        }
        this.$el.find('.videos').parentsUntil('div.form-group').removeClass('has-error');
        
        var videoId = this.$el.find('.videos :selected').attr('value');
        var video = this.videos.get(videoId);
        this.model.backend.addOverlay({video: video});
      },
      _editOverlay: function() {
        if (this.$el.find('.videos :selected').attr('value') == -1) {
          this.$el.find('.videos').parentsUntil('div.form-group').addClass('has-error');
          alert('Please select a video footage first.');
          return;
        }
        this.$el.find('.videos').parentsUntil('div.form-group').removeClass('has-error');
        
        if (this.$el.find('.overlays :selected').length == 0) {
          this.$el.find('.overlays').parentsUntil('div.form-group').addClass('has-error');
          alert('Please select an overlay first.');
          return;
        }
        this.$el.find('.overlays').parentsUntil('div.form-group').removeClass('has-error');
        
        var videoId = this.$el.find('.videos :selected').attr('value');
        var video = this.videos.get(videoId);
        var overlayId = this.$el.find('.overlays :selected').attr('value');
        var overlay = this.overlays.get(overlayId);
        this.model.backend.editOverlay({video: video, overlay: overlay});
      },
      _deleteOverlay: function() {
        if (this.$el.find('.overlays :selected').length == 0) {
          this.$el.find('.overlays').parentsUntil('div.form-group').addClass('has-error');
          alert('Please select an overlay first.');
          return;
        }
        this.$el.find('.overlays').parentsUntil('div.form-group').removeClass('has-error');
        
        var overlayId = this.$el.find('.overlays :selected').attr('value');
        var overlay = this.overlays.get(overlayId);
        this.model.backend.deleteOverlay({overlay: overlay});
      }
    });
    
    return LocationEditView;
  }
);