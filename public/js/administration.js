/*	++++++++++++++++++++++
 *	GLOBAL VARIABLES 
 * 	++++++++++++++++++++++
 */
var glob = [];
var map; 
/*	++++++++++++++++++++++
 *	EVENT LISTENERS 
 * 	++++++++++++++++++++++
 */

/*	++++++++++++++++++++++
 *	FUNCTIONS
 * 	++++++++++++++++++++++
 */

// Initialize map
$(document).ready(function(){
	//Initialize map
	map = L.map('map').setView([51.962655, 7.625763], 15);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    	maxZoom: 18
	}).addTo(map);
	//drawMarkers();
});

//Backbone models
var VideoCollection = Backbone.Model.extend({
		urlRoot: '/api/locations',
});

//Backbone views
var MarkerView = Backbone.View.extend({
	render: function(){
		console.log("View is alive");
		drawMarkers();
	}
});

//Backbone routers
var ROUTER = Backbone.Router.extend({
	routes: {
		'' : 'home'
	}
});

//Initialize backbone entities
var marker_view = new MarkerView({
	el: $("#map")
});
var router = new ROUTER();



//Router events
router.on('route:home', function(){
	console.log("Route: home");
	marker_view.render();
});

Backbone.history.start();

function drawMarkers() {

var videos = new VideoCollection();
var locations;

videos.fetch({
	success: function(videos){
		locations = videos.get("locations");
		$.each(locations, function(index, value){
			console.log(index + " : " + value.lat);
			L.marker([value.lat, value.lon]).addTo(map).bindPopup(
				"<table class=popup>" +
				"<tr><td><b>Name</b>:</td><td>" + value.name + "</td></tr>" +
				"<tr><td><b>Video-ID</b>:</td><td>" + value.id + "</td></tr>" +
				"<tr><td><b>Coordinates</b>:</td><td>" + value.lat +", "+ value.lon + "</td></tr>" +
				"<tr><td><b>Description</b>:</td><td>" + value.description + "</td></tr>" + 
				"</table>" + 
				"<span style=\"width:100%; text-align:center;\">" + 
				"<a href=\"index.html?currentId=" + value.id + "\">Go to this video</a>" +
				"</span>"
				
			).openPopup();
		});	
	}
});	


}