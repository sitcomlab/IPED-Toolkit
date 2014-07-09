/*	++++++++++++++++++++++
 *	GLOBAL VARIABLES 
 * 	++++++++++++++++++++++
 */
var glob = [];
var map; 
var coords;

/*	++++++++++++++++++++++
 *	EVENT LISTENERS 
 * 	++++++++++++++++++++++
 */

$("#submit-location").click(function(){
	submitLocation();
})


/*	++++++++++++++++++++++
 *	Initializers
 * 	++++++++++++++++++++++
 */


$("#add-location-dialog").dialog({
	autoOpen: false,
	height: 400,
	show: {
        effect: "fade",
        duration: 500
      },
      hide: {
        effect: "fade",
        duration: 500
      }
});

$(".button").button();
$("submit").button();

$( "#spinner" ).change(function() {
      $( "#spinner" ).spinner( "option", "culture", $( this ).val() );
    });
    
$("#spinner").spinner();    

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
	coords = e.latlng;
	$("#coordinates").text(coords.lat + ", " + coords.lng);
    console.log("Coordinates saved: " + coords); // e is an event object (MouseEvent in this case)
    console.log("Latitude: " + coords.lat + ", Longitude: " + coords.lng);
	});
	
});


/*	++++++++++++++++++++++
 *	BACKBONE
 * 	++++++++++++++++++++++
 */

//Backbone models
var Locations = Backbone.Model.extend({
		urlRoot: '/api/locations',
});

var Videos = Backbone.Collection.extend({
	urlRoot: '../api/videos'
}); 

var LocationModel = Backbone.Model.extend({
	dataType: "json",
	urlRoot: '../api/locations',
	defaults: {
		name: '',
		tags: [],
		lon: '' ,
		lat: '',
		description: '',
		relatedLocations: [],
		videos: [],
		overlays: []
	}
});

//Backbone views
var AddLocationView = Backbone.View.extend({
	el: '#add-location-dialog',
	render: function(){
		console.log("AddLocationView: rendering function entered");
		var that = this;
		var videos = new Videos();
		videos.fetch({
			success: function(footages){
				var template =  _.template($("#add-new-location-template").html(), {videos: videos.videos});
				this.$el.html(template);
			}
		});
		
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
	drawMarkers();
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

var locationcollection = new Locations();
var locations;

locationcollection.fetch({
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
	//console.log("entered callback (openDialog)");
	//$("#add-location-panel").panel("open");
	// Dialog loaded via Ajax
	//window.open("#new/location","_self");
	//$("#add-location-dialog").dialog("open");
}

function submitLocation(){
	
	var locname = $("#name").val(),
		locdescription = $("#description").val();
	var loctags = [],	
		loctags = "[" + $("#tags").val() + "]";
	var latitude = coords.lat,
		longitude = coords.lng;
			
		console.log("Location values: " + locname + ", " + locdescription + ", " + loctags);
		
	var newLocation = new LocationModel();	
	var locationDetails = {
		name: locname,
		description: locdescription,
		tags: loctags,
		lat: latitude,
		lon: longitude
	};	
	
	console.log("Object to be transmitted: ");
	console.log(locationDetails);
	newLocation.save(locationDetails, {
		headers: {"contentType": "application/json", "dataType": "json"},
		success: function(newLocation){
			console.log("New Location was submitted:");
			console.log(newLocation.toJSON());
			router.navigate('', {trigger: true});
			$("#add-location-dialog").dialog("close");
			
		}
	});
	
	
	
		
	
}
