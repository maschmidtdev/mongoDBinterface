// Import required libraries
require(__dirname + '/../GMS_MMO/Resources/config.js');
var mongoose = require('mongoose');
var admin = mongoose.mongo.Admin;
var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 61027;


// Load the initializers
var init_files = fs.readdirSync(__dirname + "/../GMS_MMO/Initializers");
init_files.forEach(function(initFile){
  console.log('Loading Initializer: ' + initFile);
  require(__dirname + "/../GMS_MMO/Initializers/" + initFile);
});

// Load the models
var model_files = fs.readdirSync(__dirname + "/../GMS_MMO/Models");
model_files.forEach(function(modelFile){
  console.log('Loading Model: ' + modelFile);
  require(__dirname + "/../GMS_MMO/Models/" + modelFile)
});


gamedb.once('open', function (callback) {
  console.log("MongoDB connection established.");
  console.log(Object.keys(User.schema.paths));
  console.log('Length: ' + Object.keys(User.schema.paths).length);
});

////////////////
//  Routing   //
////////////////
app.use(express.static(__dirname + '/public'));

// Home
app.get('/', function(req, res){
  console.log("sendFile: index.html");
  res.sendFile(__dirname + '/index.html');
});


//////////////////////////////////////////
// Server/Client communication handlers //
//////////////////////////////////////////
io.on('connection', function(client){ 
  console.log('A user connected.');

  // Initialize Page
  client.on('initialize', function(){
    // Retrieve list of available collections
    gamedb.db.listCollections().toArray(function(err, collections){
      if(err){
        console.log('err: ' + err);
      } else {
        for(i in collections){
          console.log('collection ' + i + ': ' + collections[i].name);
        }
      }
      // Retrieve users collection from db
      User.find().lean().exec(function (err, users) {
        if (err) return console.error(err);

        // Send user data to requesting client only
        io.sockets.connected[client.id].emit('initialize', {users: users, collections: collections});

      });
    });
  });

  // Collection Data Request Handler
  client.on('collection data', function(collectionName){

    var Model = gamedb.model(collectionName);

    Model.find().lean().exec(function (err, docs) {
        if (err) return console.error(err);

        for(i in docs){
          console.log('docs['+i+'].username: ' + docs[i].username);
        }

        var attrNames = Object.keys(Model.schema.paths);

        // Send user data to requesting client only
        io.sockets.connected[client.id].emit('collection data', {documents: docs, attrNames: attrNames});

      });
  });

  // Delete document handler
  client.on('delete document', function(data){

    var Model = gamedb.model(data.model);

    // delete the document from the collection
    console.log("Deleting user: " + data.username + " in Collection: " + data.model);
    Model.remove({username: data.username}, function(err){
      if(!err){
        console.log("Successfully deleted " + data.username + " from " + data.model);
        // refresh the collection view only for requesting client
        io.sockets.connected[client.id].emit('refresh collection', data.model);
      }else{
        console.log("Error: " + err);
      }
    });
  });

  // Disconnect Handler
  client.on('disconnect', function(){
  	console.log('client ' + client.id + ' disconnected');
  	io.emit('disconnect', client.id);
  });

});


// Start server, listen for connections
http.listen(port, function(){
  console.log('listening on *:' + port);
});


