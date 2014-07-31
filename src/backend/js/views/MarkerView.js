define(['backbonejs/js/backbone',
        'backend/views/LocationMarkerView'],
  function(Backbone) {
    /**
    * The Backbone.js view for a leaflet marker
    */
    MarkerView = Backbone.View.extend({
      initialize: function(opts) {
        this.map = opts.map;
        this.markerIcon = L.icon({
                                  iconUrl: '../lib/leaflet/images/marker-icon.png',
                                  shadowUrl: '../lib/leaflet/images/marker-shadow.png'
                                 });
        
        // All locations are at the very same location, so just use the lat/lon of the first element
        this.marker = L.marker([this.model.locations.at(0).get('lat'), this.model.locations.at(0).get('lon')],
                               {icon: this.markerIcon});
        this.marker.markerView = this;
        this.locationMarkerView = new LocationMarkerView({model: {backend: this.model.backend,
                                                                 locations: this.model.locations}});
        this.featureGroup = L.featureGroup().addTo(this.map);
        
        _.bindAll(this, 'removeMarker')
      },
      render: function() {
        this.marker.addTo(this.featureGroup)
                   .bindPopup(this.locationMarkerView.el, {minWidth: 300});
      },
      removeMarker: function() {
        this.featureGroup.clearLayers();
      }
    });
    
    return MarkerView;
  }
);