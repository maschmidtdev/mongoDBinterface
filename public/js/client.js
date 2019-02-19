//////////////////
//	Initialize	//
//////////////////
var socket = io();

// Initial data request
$(document).ready(function() {
    socket.emit('initialize');
}).on('click', '.togglebutton', function(){
	$(this).next().slideToggle(150);
	if($(this).html() == '-'){
		$(this).html('+');
	}else{
		$(this).html('-');
	}

}).on('click', '.collectionLink', function(){
	// flag this as the active collection
	$(this).addClass('activeCollection');
	// Delete currently visible data
	refreshCollection($(this).html());
	//$('#main-content-col').html('');

}).on('click', '.delete', function(){
	// get position(id) of current document and parse it to integer
	var id = $(this).attr('id').split('delete')[1];
	// get the username(unique) of the document
	var username = $('.username.'+id+'').html();
	// get the model we're currently viewing documents of
	var model = $('.collectionLink.activeCollection').html();
	// request deletion of selected document to server
	socket.emit('delete document', { username: username, model: model });

});

//////////////////////
// 		JQuery		//
//////////////////////

$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});

$('#home').click(function(){
  console.log('test');
  window.location.replace("http://gazu.carina.uberspace.de:61027");
});




//////////////////////////////////
// Client Server communication	//
//////////////////////////////////

// initialize the Interface
socket.on('initialize', function(data){
	$('#left-content-col').append($('<ul id="collectionList">'));
	for(i in data.collections){
		if(i < data.collections.length-1){
			$('#collectionList').append($('<li>').html('<p class="collectionLink">'+data.collections[i].name+'</p>'));
		}
	}
});

// build the collections data from chosen collections
socket.on('collection data', function(data){
	for(i in data.documents){
		$('#main-content-col').append($('<button type="button" class="togglebutton">').html('-').css('display', 'block'));
		$('#main-content-col').append($('<ul class="document" id="document' + i + '">'));
		$('#document'+i+'').append($('<button type="button" class="delete" id="delete' + i + '">').html('Delete').css('display', 'inline-block'));


		for(j in data.attrNames){
			$('#document'+i+'').append($('<li>').html('<div class="inline-div"><div class="leftalign">' + data.attrNames[j]
				+ '</div></div><div class="inline-div"><div class="rightalign ' + data.attrNames[j] + ' ' + i + '">' 
				+ data.documents[i][data.attrNames[j]] + '</div></div>'));
		}

	}
});

socket.on('users', function(users){
	for(i in users){
		$('#messages').append($('<li>').text(users[i].username));
	}
});

socket.on('refresh collection', function(collection){
	refreshCollection(collection);
});

socket.on('disconnect', function(userID){
  	//$('#messages').append($('<li>').text('user ' + userID + ' disconnected'));
});


//////////////////////////////////
//	 		Functions			//
//////////////////////////////////

// refresh docuemnts of current collection
refreshCollection = function(collection){
	console.log("TEST");
	$('#main-content-col').html('');
	// Request document data for clicked collection
	socket.emit('collection data', collection);
}