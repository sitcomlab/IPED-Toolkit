/********************************************************************************************
 Node.js Webserver
 Morins Testzeile

 ********************************************************************************************
 Table of content

 1. Server-Settings
 2. API
 2.1 GET all nodes
 2.2 GET general information about one node
 2.3 GET all nodes next to this node
 2.4 GET a list with all nodes and with their current relationships
 2.5 CREATE a new node
 2.6 EDIT a node
 2.7 DELETE a node
 2.8 SET one or more relationships for one node
 2.9 EDIT relations for one node
 2.10 DELETE relations for one node

 *********************************************************************************************/

/****************************
 1. Server-Settings
 ****************************/

// Connection to the Neo4j-Database
var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');

// Loading package "Express" for creating a webserver
var express = require('express');
var app = express();
var server = app.listen(8080);
console.log("App listens on http://localhost:8080");

// Socket.io packages
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
	io.sockets.emit('news', {
		Info : 'New Connection'
	});
	socket.on('message', function(data) {
		console.log(data);

	});
	socket.on('remote', function(data) {
		io.sockets.emit('command', data);
		console.log(data);
	});
});

// Loading package "body-parser" for making POST and PUT requests
var bodyParser = require('body-parser');
app.use(bodyParser());

// Public-folder to upload media, like videos
app.set("view options", {
	layout : false
});
app.use(express.static(__dirname + '/public'));

/****************************
 2. API
 ****************************/

// 2.1 GET all nodes
app.get('/api/nodes', function(req, res) {

	// Database Query
	db.cypherQuery("match (i:Video) return i", function(err, result) {
		if (err)
			throw err;

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.send('{"nodes":' + jsonString + '}');
	});
});

// 2.2 GET general information about one node
app.get('/api/nodes/:id', function(req, res) {

	// Database Query
	db.cypherQuery("match (i:Video) where i.id=" + req.params.id + " return i ", function(err, result) {
		if (err)
			throw err;

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.send('{"node":' + jsonString + '}');
	});
});

// 2.3 GET all nodes next to this node
app.get('/api/nodes/:id/relations', function(req, res) {

	// Database Query
	db.cypherQuery("MATCH (i:Video)-->(n:Video) WHERE i.id=" + req.params.id + "RETURN n", function(err, result) {
		if (err)
			throw err;

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.send('{"nodes":' + jsonString + '}');
	});
});

// 2.4 Get all displays related to one node
app.get('/api/nodes/:id/displays', function(req, res) {

	// Database Query
	db.cypherQuery('match (Video {id:' + req.params.id + '})<-[:belongs_to]-(display) return display', function(err, result) {

		if (err)
			throw err;

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.send('{"displays":' + jsonString + '}');

	});
});

// 2.5 CREATE a new node
app.post('/api/new/node', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {
			throw err;
			res.statusCode = 500;
			return res.send('Error 500: Node not added!');
		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.statusCode = 200;
			return res.send('Node added!');
		}
	});
});

// 2.6 EDIT a node
app.put('/api/nodes/:id', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {
			throw err;
			res.statusCode = 500;
			return res.send('Error 500: Node not edited!');
		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.statusCode = 200;
			return res.send('Node edited!');
		}
	});
});

// 2.7 DELETE a node
app.
delete ('/api/nodes/:id',
function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {
			throw err;
			res.statusCode = 500;
			return res.send('Error 500: Node not deleted!');
		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.statusCode = 200;
			return res.send('Node deleted!');
		}
	});
});

// 2.8 SET one or more relationships for one node
app.post('/api/new/node/:id/relations', function(req, res) {

	// create a relation in both directions for each video
	for ( i = 0; i < req.body.newralations.ids[i].length; i++) {
		// Database Query
		db.cypherQuery("match (v:Video) where v.id=" + req.params.id + " match (q:Video) where q.id = " + req.body.newrelations.ids[i] + " create (v)-[:related]->(q) create (q)-[:related]->(v))", function(err, result) {
			if (err) {
				throw err;
				res.statusCode = 500;
				return res.send('Error 500: Relationship(s) not added!');
			} else {
				console.log(result.data);
				// delivers an array of query results
				console.log(result.columns);
				// delivers an array of names of objects getting returned

				var jsonString = JSON.stringify(result.data);

				res.statusCode = 200;
				return res.send('Relationship(s) added!');
			}
		});
	}
});

// 2.9 EDIT relations for one node

// 2.10 DELETE relations for one node

