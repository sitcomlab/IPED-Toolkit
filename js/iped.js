
/***********************
  Initialize JQuery UI
 ***********************/

$("button").button();




/********************
 	Global Variables
 *******************/





/********************
 	Functions
 *******************/

/*$(document).ready(function(){
	database = new ODatabase('http://localhost:2480/IPED');
    databaseInfo = database.open('root', 'sitcomlab');
});*/

$("#middle").click(function(){
	console.log('Button clicked: middle');
	var target = 'middle';
	loadVideo(target);
});

$("#left").click(function(){
	console.log('Button clicked: left');
	var target = 'left';
	loadVideo(target);	
});

$("#right").click(function(){
	console.log('Button clicked: right');
	var target = 'right';
	loadVideo(target);	
});

function loadVideo(route_url){
	var new_location = getVideoLocation(route_url);
	
	$("#video").replaceWith('<video id="video" controls="true">' + 
							'<source id ="video_source" src="' + new_location + '" type="video/mp4">' + 
							'</video>');

function getVideoLocation(url){
	var hosturl = 'http://giv-sitcomlab.uni-muenster.de/index.php/' + url; 
	var location;
	
	$.ajax({
			'async': false,
			'url': hosturl,
			'dataType': "text",
			'beforeSend': function() {console.log("Request wird gesendet...");},
			'success': function (data) {console.log("Request erfolgreich, URL wurde übermittelt..."); location = data;},
			'error': function(jqXHR, textStatus, errorThrown) {alert('Error ' + errorThrown);}
		});
	console.log("Ajax-Befehl abgeschlossen");	
	return location;	
}


}