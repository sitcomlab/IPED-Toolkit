/*	++++++++++++++++++++++
 *	GLOBAL VARIABLES
 * 	++++++++++++++++++++++
 */
var glob = [];
var map;
var coords;
var currentId;

/*	++++++++++++++++++++++
 *	EVENT LISTENERS
 * 	++++++++++++++++++++++
 */

/*	++++++++++++++++++++++
 *	Initializers
 * 	++++++++++++++++++++++
 */

$("#add-location-dialog").dialog({
	autoOpen : false,
	height : 550,
	show : {
		effect : "fade",
		duration : 500
	},
	hide : {
		effect : "fade",
		duration : 500
	}
});

$("#edit-location-dialog").dialog({
	autoOpen : false,
	height : 550,
	show : {
		effect : "fade",
		duration : 500
	},
	hide : {
		effect : "fade",
		duration : 500
	}
});

// Initialize map
$(document).ready(function() {
	var options = {
		contextmenu : true,
		contextmenuWidth : 180,
		contextmenuItems : [{
			text : 'Add New Location Here',
			callback : openDialog
		}]
	};

	//Initialize map
	map = L.map('map', options).setView([51.962655, 7.625763], 15);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		maxZoom : 18
	}).addTo(map);
	drawMarkers();
	map.on('contextmenu', function(e) {
		coords = e.latlng;

		// e is an event object (MouseEvent in this case)

	});
});

/*	++++++++++++++++++++++
*	BACKBONE
* 	++++++++++++++++++++++
*/

//Backbone models
var Locations = Backbone.Model.extend({
	urlRoot : '/api/locations'
});

var VideoCollection = Backbone.Model.extend({
	urlRoot : '/api/videos',
	url : '/api/videos'
});

var OverlayCollection = Backbone.Model.extend({
	urlRoot : '/api/overlays',
	url : '/api/overlays'
});

var LocationModel = Backbone.Model.extend({
	dataType : "json",
	urlRoot : '../api/locations',
	defaults : {
		name : '',
		tags : [],
		lon : '',
		lat : '',
		description : '',
		relatedLocations : [],
		videos : [],
		overlays : []
	}
});

//Backbone views
var AddLocationView = Backbone.View.extend({
	el : '#add-location-dialog',
	initialize : function() {
		console.log("AddLocationView created");
	},
	render : function() {
		
		var that = this;
		var videos;
		videos = new VideoCollection();
		//var overlays;
		var overlays = new OverlayCollection();
		//var template;
		videos.fetch({
			//url: '/api/videos',
			success : function(footages) {
				console.log("AddLocationView: videos.fetch() entered");
				var videos = footages.get("videos");
				var footageselection = [];
				var overlayselection = [];
				var tags = [];
				//videos = footages.get("videos");
				var template = _.template($("#add-new-location-template").html(), {
					videos : videos
				});
				//template =  _.template($("#add-new-location-template").html(), {videos: videos});
				that.$el.append(template);
				console.log("videos loaded:");
				console.log(videos);
				$(".button").button();
				$("#add-tag-btn").click(function() {
					tags.push($("#tags").val());
					$("#tags").val("");
					console.log(tags);
				});
				$("#add-footage-btn").click(function() {
					console.log("Footage Button clicked");
					console.log($("#footage-spinner").val());
					footageselection.push($("#footage-spinner").val());
					console.log(footageselection);
				});
				overlays.fetch({
					//url: '/api/overlays',
					success : function(displays) {

						console.log("AddLocationView: overlays.fetch() entered");
						var overlays = displays.get("overlays");
						//overlays = displays.get("overlays");
						var template2 = _.template($("#add-new-location-template2").html(), {
							overlays : overlays
						});
						//template =  _.template($("#add-new-location-template").html(), {overlays: overlays});
						that.$el.append(template2);
						console.log("overlays loaded:");
						console.log(overlays);
						$.each(overlays, function(index, value) {
							console.log(value.name);
						});
						$("#add-overlay-btn").button();
						$("#add-overlay-btn").click(function() {
							console.log("Overlay Button clicked");
							//console.log($("#overlay-spinner").spinner("value"));
							console.log($("#overlay-spinner").val());
							overlayselection.push($("#overlay-spinner").val());
							console.log(overlayselection);
						});
						$("#submit-location").button();
						$("#submit-location").click(function() {
							console.log("Submit Button clicked");
							submitLocation(footageselection, overlayselection, tags);
							console.log("New Location successfully Submitted!");
						});
						$("#coordinates").text(coords.lat + ", " + coords.lng);
						console.log("Coordinates saved: " + coords);
						console.log("Latitude: " + coords.lat + ", Longitude: " + coords.lng);
					}
				});
				$.each(videos, function(index, value) {
					console.log(value.name);

				});

			}
		});
		console.log("AddLocationView rendered");
		$("#add-location-dialog").dialog("open");
	}
});

var EditLocationView = Backbone.View.extend({
	el : '#edit-location-dialog',
	initialize : function() {
		console.log("EditLocationView created");
	},
	render : function(id) {
		var location = new LocationModel({
			id : id
		});
		location.fetch({
			success : function(location) {
				console.log("Fetch for id " + location.get("d") + " successful!");
				console.log(location.toJSON());
				$("#name").val(location.get("name"));
				$("#description").val(location.get("description"));
				var footageselection = location.get("videos");
				console.log("Footages: " + footageselection);
				var overlayselection = location.get("overlays");
				console.log("Overlays: " + overlayselection);
				var tags = location.get("tags");
				console.log("Tags: " + tags);
			}
		});
		var that = this;
		var videos;
		videos = new VideoCollection();
		//var overlays;
		var overlays = new OverlayCollection();
		//var template;
		videos.fetch({
			//url: '/api/videos',
			success : function(footages) {
				var loc = location;
				console.log("EditLocationView: videos.fetch() entered");
				var videos = footages.get("videos");
				//videos = footages.get("videos");
				var template = _.template($("#add-new-location-template").html(), {
					videos : videos
				});
				//template =  _.template($("#add-new-location-template").html(), {videos: videos});
				that.$el.append(template);
				console.log("videos loaded:");
				console.log(videos);
				$(".button").button();
				$("#add-tag-btn").click(function() {
					tags.push($("#tags").val());
					$("#tags").val("");
					console.log(tags);
				});
				$("#add-footage-btn").click(function() {
					console.log("Footage Button clicked");
					console.log($("#footage-spinner").val());
					footageselection.push($("#footage-spinner").val());
					console.log(footageselection);
				});
				overlays.fetch({
					//url: '/api/overlays',
					success : function(displays) {

						console.log("EditLocationView: overlays.fetch() entered");
						var overlays = displays.get("overlays");
						//overlays = displays.get("overlays");
						var template2 = _.template($("#add-new-location-template2").html(), {
							overlays : overlays
						});
						//template =  _.template($("#add-new-location-template").html(), {overlays: overlays});
						that.$el.append(template2);
						console.log("overlays loaded:");
						console.log(overlays);
						$.each(overlays, function(index, value) {
							console.log(value.name);
						});
						$("#add-overlay-btn").button();

						$("#add-overlay-btn").click(function() {
							console.log("Overlay Button clicked");
							//console.log($("#overlay-spinner").spinner("value"));
							console.log($("#overlay-spinner").val());
							overlayselection.push($("#overlay-spinner").val());
							console.log(overlayselection);
						});
						$("#submit-location").button();
						$("#submit-location").click(function() {
							console.log("Submit Button clicked");
							submitLocation(footageselection, overlayselection, tags);
							console.log("New Location successfully Submitted!");
						});
					}
				});
				$.each(videos, function(index, value) {
					console.log(value.name);

				});

			}
		});
		console.log("EditLocationView rendered");
		$("#edit-location-dialog").dialog("open");
	}
});

var addLocation_view = new AddLocationView();

//Backbone routers
var ROUTER = Backbone.Router.extend({
	routes : {
		'' : 'home',
		'locations/new' : 'addLocation',
		'locations/edit/:id' : 'editLocation'
	}
});

var router = new ROUTER();

//Router events
router.on('route:home', function() {
	console.log("Route: home");
	drawMarkers();
});

router.on('route:addLocation', function() {
	console.log("Route: addLocation");
	addLocation_view.render();
});

router.on('route:editLocation', function(id) {
	console.log("Route: editLocation: " + id);
	currentId = id;
	var editLocation_view = new EditLocationView();
	editLocation_view.render(id);

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
		success : function(videos) {
			locations = videos.get("locations");
			$.each(locations, function(index, value) {
				L.marker([value.lat, value.lon]).addTo(map).bindPopup("<table class=popup>" + "<tr><td><b>Name</b>:</td><td>" + value.name + "</td></tr>" + "<tr><td><b>Video-ID</b>:</td><td>" + value._id + "</td></tr>" + "<tr><td><b>Coordinates</b>:</td><td>" + value.lat + ", " + value.lon + "</td></tr>" + "<tr><td><b>Description</b>:</td><td>" + value.description + "</td></tr>" + "</table>" + "<span style=\"width:100%; text-align:center;\">" + "<a href=\"index.html?currentId=" + value._id + "\">Go to this video</a>" + "</span>" + "<a href=\"#locations/edit/" + value._id + "\">Edit</a>").openPopup();
			});
		}
	});

}

function openDialog() {
	//console.log("entered callback (openDialog)");
	//$("#add-location-panel").panel("open");
	// Dialog loaded via Ajax
	//window.open("#new/location","_self");
	router.navigate('', {
		trigger : true
	});
	$("#add-location-dialog").dialog("close");
	$("#add-location-dialog").empty();
	console.log("openDialog():  calling addLocation_view rendering function");
	router.navigate('locations/new', {
		trigger : true
	});

}

function submitLocation(videos, overlays, tags) {
	
	var locname = $("#name").val(), locdescription = $("#description").val();
	var loctags = tags;
	var latitude = coords.lat, longitude = coords.lng;
	var locvideos = videos;
	var locoverlays = overlays;

	console.log("Location values: " + locname + ", " + locdescription + ", " + loctags);

	var newLocation = new LocationModel();
	var locationDetails = {
		name : locname,
		description : locdescription,
		tags : loctags,
		lat : latitude,
		lon : longitude,
		videos : locvideos,
		overlays : locoverlays

	};

	console.log("Object to be transmitted: ");
	console.log(locationDetails);
	newLocation.save(locationDetails, {
		headers : {
			"contentType" : "application/json",
			"dataType" : "json"
		},
		success : function(newLocation) {
			console.log("New Location was submitted:");
			console.log(newLocation.toJSON());
			console.log(JSON.stringify(newLocation.toJSON()));
			router.navigate('', {
				trigger : true
			});
			$("#add-location-dialog").dialog("close");

		}
	});

}

