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
 *	Initializers
 * 	++++++++++++++++++++++
 */

$("#add-location-dialog").dialog({
	autoOpen: false,
	show: {
        effect: "fade",
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      }
});

// Initialize map
$(document).ready(function(){
	var options = {
		contextmenu: true,
		contextmenuWidth: 180,
		contextmenuItems: [{
			text: 'Add New Location Here',
			callback: openDialog
		}]
	};
	
	//Initialize map
	map = L.map('map', options).setView([51.962655, 7.625763], 15);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    	maxZoom: 18
	}).addTo(map);
	drawMarkers();
	
	map.on('contextmenu', function(e) {
	var coords = e.latlng;
	$("#coordinates").text(coords.lat + ", " + coords.lng);
    console.log("Coordinates saved: " + coords); // e is an event object (MouseEvent in this case)
    console.log("Latitude: " + coords.lat + ", Longitude: " + coords.lng);
	});
	
	console.log("Test of map.on.coords: " + map.on.coords);
});



/*	++++++++++++++++++++++
 *	BACKBONE
 * 	++++++++++++++++++++++
 */

//Backbone models
var VideoCollection = Backbone.Model.extend({
		urlRoot: '/api/locations',
});


//Backbone views
var AddLocationView = Backbone.View.extend({
	el: '#add-new-location-dialog',
	render: function(){
		console.log("AddLocationView rendered");
		$("#add-location-dialog").dialog("open");
	}
});


var addLocation_view = new AddLocationView();


//Backbone routers
var ROUTER = Backbone.Router.extend({
	routes: {
		'' : 'home',
		'new/location' : 'addLocation'
	}
});


var router = new ROUTER();



//Router events
router.on('route:home', function(){
	console.log("Route: home");
});

router.on('route:addLocation', function(){
	console.log("Route: addLocation");
	addLocation_view.render();
});

Backbone.history.start();

/*	++++++++++++++++++++++
 *	FUNCTIONS
 * 	++++++++++++++++++++++
 */

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

function openDialog(){
	console.log("entered callback (openDialog)");
	//$("#add-location-panel").panel("open");
	// Dialog loaded via Ajax
	window.open("#new/location","_self");
	//$("#add-location-dialog").dialog("open");
}

