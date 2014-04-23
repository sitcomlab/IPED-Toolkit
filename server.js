/********************************************************************************************
		Node.js Webserver
		


********************************************************************************************
Table of content

1. Server-Settings
2. API
    2.1 Get all nodes
    2.2 Get general information about one node
    2.3 Get all nodes next this node
    
3. Used Portnumber
    
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

// Public-folder to upload media, like videos
app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));



/****************************
	2. API
****************************/

// 2.1 Get all nodes
app.get('/api/nodes', function(req, res){

    // Database Query
    db.cypherQuery("match (i:Video) return i", function(err, result){
        if(err) throw err;

        console.log(result.data); // delivers an array of query results
        console.log(result.columns); // delivers an array of names of objects getting returned
        
        var jsonString = JSON.stringify(result.data);
        
        res.send('{"nodes:"' + jsonString + '}');
    });
});


// 2.2 Get general information about one node
app.get('/api/nodes/:id', function(req, res){

    // Database Query
    db.cypherQuery("match (i:Video) where i.id="+ req.params.id +" return i ", function(err, result){
        if(err) throw err;

        console.log(result.data); // delivers an array of query results
        console.log(result.columns); // delivers an array of names of objects getting returned
        
        var jsonString = JSON.stringify(result.data);
        
        res.send('{"node:"' + jsonString + '}');
    });
});


// 2.3 Get all nodes next this node
app.get('/api/nodes/:id/relations', function(req, res){

    // Database Query
    db.cypherQuery("MATCH (i:Video)-->(n:Video) WHERE i.id=" + req.params.id + "RETURN n", function(err, result){
        if(err) throw err;

        console.log(result.data); // delivers an array of query results
        console.log(result.columns); // delivers an array of names of objects getting returned
        
        var jsonString = JSON.stringify(result.data);
        
        res.send('{"nodes:"' + jsonString + '}');
    });
});



/****************************
	3. Used Portnumber
****************************/
app.listen(8080);
console.log("App listens on http://localhost:8080");



