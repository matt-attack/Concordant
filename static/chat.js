

//function $(x) { return document.getElementById(x) };
//var $ = document.querySelectorAll.bind(document);
var $ = document.getElementById.bind(document);

document.addEventListener("DOMContentLoaded", function() {
	if (!window.console) window.console = {};
	if (!window.console.log) window.console.log = function() {};
	
	$('messageform').addEventListener("submit", function(e) {
		e.preventDefault();
	});

	$('sendbutton').addEventListener("click", function() {
		newMessage( $('messageform'));
		return false;
	});
	$("messageform").addEventListener("keypress", function(e) {
		if (e.keyCode == 13) {
			newMessage( $('messageform'));
			return false;
		}
	});
	$("messageform").addEventListener("keyup", function(e) {
		if (e.keyCode == 27) { //Escape
			// Scroll to the bottom
			var inbox = $("inbox");
			inbox.scrollTop = inbox.scrollHeight - inbox.clientHeight;
		}
	});
	
	window.setInterval(function() {
		if (updater.connecting == false && updater.connected == false) {
			updater.start();
		}
		
	}.bind(updater), 5000);
	$("message").select();
	updater.start();
});

function newMessage(form) {
	var message = {};
	message.body = $('message').value;
	message.room = current_room;
	updater.socket.send(JSON.stringify(message));
	$('message').value = "";
}

var rooms = [];
var current_room = "General";

var updater = {
	socket: null,
	
	connecting: false,
	connected: false,
	
	disconnect: function() {
		if (updater.socket != null) {
			updater.socket.close();
		}
		updater.socket = null;
		updater.connected = false;
		updater.connecting = false;
		console.log("Disconnected");
		
		$("inbox").innerHTML = "";
		$("room_list_area").innerHTML = "";
		$("users_list_area").innerHTML = "";
		rooms = [];
	},

	start: function() {
		var url = "ws://" + location.host + "/chatsocket";
		updater.connecting = true;
		updater.socket = new WebSocket(url);
		updater.socket.addEventListener("open", function(event) {
			updater.connecting = false;
			updater.connected = true;
			
			console.log("Connected");
		}.bind(updater));
		updater.socket.addEventListener("close", function(event) {
			console.log("Socket closed");
			updater.disconnect();
		}.bind(updater));
		updater.socket.addEventListener("error", function(event) {
			console.log("Socket error");
			updater.disconnect();
		}.bind(updater));
		
		updater.socket.onmessage = function(event) {
			var jdata = JSON.parse(event.data);
			if (jdata["add_user"] != null) {
				var user_button = document.createElement("div");
				user_button.id = "user-button-" + jdata["add_user"];
				user_button.className = "user_button";
				user_button.innerHTML = jdata["add_user"];
				$("users_list_area").append(user_button);
			}
			else if (jdata["remove_user"] != null) {
				var elem = document.getElementById("user-button-" + jdata["remove_user"]);
				elem.parentNode.removeChild(elem);
			}
			else if (jdata["add_room"] != null) {
				console.log("Got room");
				
				var room_name = jdata["add_room"];
				var description = jdata["description"];
				
				// Add the room
				var room = document.createElement("div");
				room.id = "room-" + room_name;
				$("inbox").append(room);
				
				room.description = description;
				rooms[rooms.length] = room;
				
				if (rooms.length > 1) {
					room.style.display = "none";//hides the room
				}
				else {
					current_room = room_name;
					$("header").innerHTML = room_name + ": " + description;
					var inbox = $("inbox");
					inbox.scrollTop = inbox.scrollHeight - inbox.clientHeight;
				}
				
				// Need to also add room links
				var room_button = document.createElement("div");
				room_button.id = "room-button-" + jdata["add_room"];
				room_button.className = "room_button";
				room_button.innerHTML = room_name;
				room_button.addEventListener("click", function() {
					for (var i = 0; i < rooms.length; i++)
					{
						rooms[i].style.display = "none";
					}
					var room = $("room-" + room_name);
					room.style.display = "";
					current_room = room_name;
					$("header").innerHTML = room_name + ": " + room.description;
					var inbox = $("inbox");
					inbox.scrollTop = inbox.scrollHeight - inbox.clientHeight;
					return false;
				}.bind(room_name));
				$("room_list_area").append(room_button);
			}
			else {
				updater.showMessage(jdata);
			}
		}
	},

	showMessage: function(message) {
		var existing = $("m" + message.id);
		if (existing != null) return;
		
		var node = document.createElement("div");
		node.className = "message";
		node.id = 'm' + message.id;
		
		// Format time and actually add the message
		var date = new Date(0);
		date.setUTCSeconds(parseFloat(message.time));
		var time_str = date.getHours().toString();
		if (date.getMinutes() < 10) {
			time_str += ":0" + date.getMinutes().toString();
		}
		else {
			time_str += ":" + date.getMinutes().toString();
		}
		node.innerHTML = '<span class="time">' + time_str +
						 "</span> - " + '<span class="name">' + message.user +
						 "</span>" + ": " + message.html;
						 
		// look for an image in the message body 
		// if we see it, add an image tag for it
		var pat = /http[\w\d://.-]+((.jpg)|(.png)|(.jpeg)|(.gif))/g;
		var val = pat.exec(message.body);
		console.log(val);
		if (val) {	
			node.innerHTML += '<div/><div class="embed_img"'
								+ ' style="background-image: url(' + val[0] + ')">';
		}
		
		var room = $("room-" + message.room);
		room.append(node);
		
		var inbox = $("inbox");
		// Scroll the room down if I can
		var isScrolledToBottom = inbox.scrollHeight - inbox.clientHeight <= inbox.scrollTop + 21;

		if (isScrolledToBottom) {
			inbox.scrollTop = inbox.scrollHeight - inbox.clientHeight;
		}
	}
};
