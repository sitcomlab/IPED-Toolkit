
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

$(document).ready(function(){
	database = new ODatabase('http://localhost:2480/IPED');
    databaseInfo = database.open('root', 'sitcomlab');
});
