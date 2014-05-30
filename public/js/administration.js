// Initialize JQuery UI elements
/*$( "#button" ).button();
$(function() {
    $( "#menu" ).menu();
  });
  
$("#menu").panel();
*/

$(document).ready(function(){
	//Initialize map
	var map = L.map('map').setView([51.962655, 7.625763], 15);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    	maxZoom: 18
	}).addTo(map);
});

