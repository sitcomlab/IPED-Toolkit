/********************************************************************************************
 Node.js Webserver
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

var os = require('os');
var neo4j = require('node-neo4j');
var express = require('express');
var util = require('util');
var socketio = require('socket.io');
var bodyParser = require('body-parser');

/****************************
 1. Server-Settings
 ****************************/

// Connection to the Neo4j-Database
db = new neo4j('http://giv-sitcomlab.uni-muenster.de:7474');

// Loading package "Express" for creating a webserver
var app = express();
var server = app.listen(8080);
console.log("App listens on " + os.hostname() + ":" + server.address().port);

// Socket.io packages
var io = socketio.listen(server);
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
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"nodes":' + jsonString + '}');
		return;
	});
});

// 2.2 GET general information about one node
app.get('/api/nodes/:id', function(req, res) {

	// Database Query
	db.cypherQuery("match (i:Video) where i.id=" + req.params.id + " return i ", function(err, result) {
		if (err) {

			throw err;

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"node":' + jsonString + '}');
		return;
	});
});

// 2.3 GET all nodes next to this node
app.get('/api/nodes/:id/relations', function(req, res) {

	// Database Query
	db.cypherQuery("MATCH (i:Video)-->(n:Video) WHERE i.id=" + req.params.id + "RETURN n", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"nodes":' + jsonString + '}');
		return;

	});
});

// 2.4 Get all displays related to one node
app.get('/api/nodes/:id/displays', function(req, res) {

	// Database Query
	db.cypherQuery('match (Video {id:' + req.params.id + '})<-[:belongs_to]-(display) return display', function(err, result) {

		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"displays":' + jsonString + '}');
		return;

	});
});

// 2.5 CREATE a new node
app.post('/api/new/node', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {id: " + req.body.newvideo.id + ", name:" + req.body.newvideo.name + "description:\"" + req.body.newvideo.description + ", gps: \"[" + req.body.newvideo.gps + "]\", url: \"media/video/" + req.body.newvideo.dataname + "\"," + "tags:\"[" + req.body.newvideo.dataname + "\"]\"})", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.writeHead(200, {
				'Content-Type' : 'text/plain'
			});
			res.end('Node added!');
			return;
		}
	});
});

// 2.6 EDIT a node
app.put('/api/nodes/:id', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.writeHead(200, {
				'Content-Type' : 'text/plain'
			});
			res.end('Node edited!');
			return;
		}
	});
});

// 2.7 DELETE a node
app.delete ('/api/nodes/:id',
function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.writeHead(200, {
				'Content-Type' : 'text/plain'
			});
			res.end('Node deleted!');
			return;
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

				res.writeHead(500, {
					'Content-Type' : 'text/plain'
				});
				res.end("Error:" + err);
				return;

			} else {
				console.log(result.data);
				// delivers an array of query results
				console.log(result.columns);
				// delivers an array of names of objects getting returned

				var jsonString = JSON.stringify(result.data);

				res.writeHead(200, {
					'Content-Type' : 'text/plain'
				});
				res.end('Relationship(s) added!');
				return;
			}
		});
	}
});

// 2.9 EDIT relations for one node

// 2.10 DELETE relations for one node

