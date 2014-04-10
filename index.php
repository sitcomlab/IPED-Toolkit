<?php
/**
 * Step 1: Require the Slim Framework
 *
 * If you are not using Composer, you need to require the
 * Slim Framework and register its PSR-0 autoloader.
 *
 * If you are using Composer, you can skip this step.
 */
require 'Slim/Slim.php';
require 'orientdb-php/OrientDB/OrientDB.php';
\Slim\Slim::registerAutoloader();

/**
 * Step 2: Instantiate a Slim application
 *
 * This example instantiates a Slim application using
 * its default settings. However, you will usually configure
 * your Slim application now by passing an associative array
 * of setting names and values into the application constructor.
 */
$app = new \Slim\Slim();

/**
 * Step 3: Define the Slim application routes
 *
 * Here we define several Slim application routes that respond
 * to appropriate HTTP request methods. In this example, the second
 * argument for `Slim::get`, `Slim::post`, `Slim::put`, `Slim::patch`, and `Slim::delete`
 * is an anonymous function.
 */

// GET route
$app->get('/middle', function() use ($app){
		$middle = 'Route: Middle | ';
		$request = Slim\Slim::getInstance() -> request();
		//echo($middle);
		$db = new OrientDB('giv-sitcomlab.uni-muenster.de', 2424);
		//echo 'New orientdb instance created | ';
		$connected = $db->connect('sitcomlab', 'r245#2014');
		//echo ('Connected to server | ');
		$config = $db->DBOpen('test', 'sitcomlab', 'r245#2014');
		//echo ('Connected to Database!');
		//$dbcon -> exec("set names utf8");
		//$sql = utf8_encode("SELECT * FROM baumverzeichnis ORDER BY ID");
		
		$records = $db->query('select * from knoten where @rid=#9:1');
		
		//echo json_encode(array('results' => $records));
		echo json_encode($records);
		/*try{
			$stmt = $dbcon ->prepare($sql);
			$stmt -> bindParam("baum_id", $id);
			$stmt -> execute();
			$dbcon = null;
			$ergebnis = $stmt -> fetchAll(PDO::FETCH_OBJ);
			echo json_encode(array('baumverzeichnis' => $ergebnis));


		} catch(PDOException $e){
				printError($e -> getMessage(), 500, $app);
		}*/

});

$app->get(
	'/echo',
    function () {
   echo 'SITCOM RULEZ';
    }
);


// POST route
$app->post(
    '/post',
    function () {
        echo 'This is a POST route';
    }
);

// PUT route
$app->put(
    '/put',
    function () {
        echo 'This is a PUT route';
    }
);

// PATCH route
$app->patch('/patch', function () {
    echo 'This is a PATCH route';
});

// DELETE route
$app->delete(
    '/delete',
    function () {
        echo 'This is a DELETE route';
    }
);

/**
 * Step 4: Run the Slim application
 *
 * This method should be called last. This executes the Slim application
 * and returns the HTTP response to the HTTP client.
 */
$app->run();
