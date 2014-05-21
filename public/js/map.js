var PORT = ':8080/';
var map = L.map('map').setView([51.962266, 7.621651], 17);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
	maxZoom : 18,
	attribution : 	'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + 
					'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 
					'Imagery © <a href="http://mapbox.com">Mapbox</a>',
	id : 'examples.map-i86knfo3'
}).addTo(map);

$(document).ready(function(){
	drawNodes();
});


function drawNodes() {
	
	var url = 'http://giv-sitcomlab.uni-muenster.de' + PORT + 'api/nodes';

	//Ajax request for loading the required video data
	var video = (function() {
		var video = null;
		$.ajax({
			'async' : false,
			'url' : url,
			'dataType' : 'json',
			'beforeSend' : function(request) {
				console.log("Request prepared: " + url);
			},
			'success' : function(data) {
				video = data;
				console.log(data);
			},
			'error' : function(jqXHR, textStatus, errorThrown) {
				alert('' + errorThrown);
			}
		});
		
		return video;
		
	})();
	
	
	// set markers
	for (var i = 0; i < video.nodes.length; i++) {
		
		L.marker([video.nodes[i].gps[0], video.nodes[i].gps[1]]).addTo(map).bindPopup(
				"<table class=popup>" +
				"<tr><td><b>Name</b>:</td><td>" + video.nodes[i].name + "</td></tr>" +
				"<tr><td><b>Video-ID</b>:</td><td>" + video.nodes[i].id + "</td></tr>" +
				"<tr><td><b>Coordinates</b>:</td><td>" + video.nodes[i].gps[0] +", "+ video.nodes[i].gps[1] + "</td></tr>" +
				"<tr><td><b>Description</b>:</td><td>" + video.nodes[i].description + "</td></tr>" + 
				"</table>" + 
				"<span style=\"width:100%; text-align:center;\">" + 
				"<a href=\"index.html?currentId=" + video.nodes[i].id + "\">Go to this video</a>" +
				"</span>"
				
			).openPopup();
	}
}