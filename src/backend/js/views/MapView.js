define(['backbonejs/js/backbone',
        'backend/models/Locations',
        'backend/views/MarkerView'],
  function(Backbone) {
    /**
    * The Backbone.js view for a leaflet map
    */
    MapView = Backbone.View.extend({
      id: 'map',
      initialize: function() {
        var thiz = this;
     
        var options = {
          contextmenu: true,
          contextmenuWidth: 180,
          contextmenuItems: [{text: 'Add new location',
                              callback : this.model.backend.addLocation}]
        };
        var muenster = [51.962655, 7.625763];
        var zoom = 15;

        this.map = L.map(this.$el.attr('id'), options).setView(muenster, zoom);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          maxZoom : 18
        }).addTo(this.map);
     
        this.featureGroup = L.featureGroup().addTo(this.map);
     
        this.map.on('contextmenu', function(e) {
          this.coords = e.latlng;
          JL('iPED Toolkit.Backend').debug('Click on map (' + this.coords + ')');
        });
     
        this.map.on('popupopen', function(event) {
          var locationMarkerView = event.popup._source.markerView.locationMarkerView;
          locationMarkerView.fetch();
        });
     
        this.listenTo(this.model.locations, 'all', this.render);
      },
      render: function() {
        var thiz = this;
        var previousLocation = null;
        var previousMarkerView = null;
     
        this.featureGroup.clearLayers();
        this.markerViews = this.model.locations.map(function(location) {
          var locations = new Locations();
       
          if (previousLocation && 
             previousLocation.get('lat') == location.get('lat') && previousLocation.get('lon') == location.get('lon')) {
               // There are two markers on top of each other (e.g., one location in two 'states').
               // Clear the previous one and apply special treatment to the new one
               previousMarkerView.removeMarker();
               locations = previousMarkerView.model.locations;
          }
          locations.add(location);
          var markerView = new MarkerView({model: {backend: thiz.model.backend,
                                                   locations: locations},
                                                   map: thiz.featureGroup});
       
          previousLocation = location;
          previousMarkerView = markerView;
          return markerView.render();
        });
      }
    });
    
    return MapView;
  }
);