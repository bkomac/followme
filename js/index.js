function init() {
	trace("init...");
	document.addEventListener("deviceready", deviceready);
}

// phonegap ready
function deviceready() {

	// navigator.splashscreen.show();

	// navigator.splashscreen.hide();
	StatusBar.overlaysWebView(false);

	document.addEventListener("menubutton", function() {
		$("#myPanel").panel("open");
	}, false);
}

$(document).ready(function() {
	documentready();
});

var map;
var markers = [];
var meMarker = null;

var infowindow;
var watchID;
var isLoging = false;
var timer = null;

var followers = 0;
var numPoints = 0;

var socket;
var app;

var lastPosition = null;

// jQuery document ready
function documentready() {
	trace("deviceready...");
	try {

		app = new OnlineUsers();

		window.addEventListener("batterystatus", app.onBatteryStatus, false);

		$("#status").html("version " + VERSION);
		toast("FollowMe ver." + VERSION);
		socket = io(remoteAddress);

		socket.on('get_position', function(rdata) {
			// echo(data, "node");
			var data = JSON.parse(rdata);

			trace("**Recieve position: " + rdata);
			$('#msg').html('<p><b>' + data.user + '</b> emits ...</p>');
			followers = data.follows;
			trace("*** user=" + getUser() + " data.usr=" + data.user + " folows:" + followers);
			if (data != null && data.user != getUser()) {
				app.addUser(data);
				panTo(data);
			}

		});

		socket.on('logon', function(rdata) {
			// echo(data, "node");
			var data = JSON.parse(rdata);

			trace("**logon: " + rdata);
			$('#msg').html('<p><b>' + data.user + '</b> emits ...</p>');
			followers = data.follows;
			trace("*** user=" + getUser() + " data.usr=" + data.user + " folows:" + followers);

		});

		socket.on('logoff', function(rdata) {
			// echo(data, "node");
			var data = JSON.parse(rdata);

			trace("**logoff: " + rdata);
			$('#msg').html('<p><b>' + data.user + '</b> emits ...</p>');
			followers = data.follows;
			trace("*** user=" + getUser() + " data.usr=" + data.user + " folows:" + followers);

		});

		// local connection events
		socket.on('connect', function() {
			trace("Connection OK.");
			$('#status').html('WS connection established...');
		});

		socket.on('connect_error', function() {
			trace("Connect error.");
			$('#status').html('WS connection error!');
		});

		socket.on('reconnecting', function(number) {
			trace("reconnecting..." + number);
			$('#status').html('Trying to reconnect... (#' + number + ')');
		});

		socket.on('reconnect_failed', function() {
			trace("reconnect_failed..." + number);
			$('#status').html('Reconnection failed...');
		});

		// socket.emit("connect", JSON.stringify(app.getAppUser()));

		clearInterval(timer);
		
		
		
		var db = new DB();
		db.open(callback);
		
		
		function callback() {
			trace("Connected...");
			db.createTodo("xxxx", callback2)
			
			function callback2() {
				trace("inserted...");
			}
		}

		// var db;
		//
		// // No support? Go in the corner and pout.
		// if (!("indexedDB" in window)) {
		// error("No IDB support!");
		// return;
		// }
		//
		// var openRequest = indexedDB.open("peopleDB", 1);
		//
		// openRequest.onupgradeneeded = function(e) {
		// var thisDB = e.target.result;
		//
		// if (!thisDB.objectStoreNames.contains("people")) {
		// thisDB.createObjectStore("people", { autoIncrement: true });
		// }
		// }
		//
		// openRequest.onsuccess = function(e) {
		// console.log("running onsuccess");
		//
		// db = e.target.result;
		//
		// var store = db.transaction([ "people" ],
		// "readwrite").objectStore("people");
		//
		// // Define a person
		// var person = {
		// name : "bobo "+Math.random(),
		// email : "b@komac.si",
		// created : ""+new Date().getTime()
		// }
		//
		// // Perform the add
		// var request = store.add(person);
		//
		// request.onerror = function(e) {
		// console.log("Error", e.target.error.name);
		// // some type of error handler
		// }
		//
		// request.onsuccess = function(e) {
		// console.log("Woot! Did it");
		// }
		// }
		//
		// openRequest.onerror = function(e) {
		// // Do something for the error
		// }

		// var db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
		// db.transaction(function(tx) {
		// tx.executeSql('DROP TABLE IF EXISTS LOGS');
		//
		// tx.executeSql('CREATE TABLE IF NOT EXISTS LOGS (id unique, log)');
		// trace("DB created.");
		// tx.executeSql('INSERT INTO LOGS (id, log) VALUES (10, "foobar")');
		// tx.executeSql('INSERT INTO LOGS (id, log) VALUES (200, "logmsg 3")');
		// tx.executeSql('INSERT INTO LOGS (id, log) VALUES (200, "logmsg 2")');
		// });
		//
		// db.transaction(function(tx) {
		// tx.executeSql('SELECT * FROM LOGS', [], function(tx, results) {
		// trace("nim rows:" + results.rows.length);
		//
		// for (i = 0; i < results.rows.length; i++) {
		// trace("row:" + results.rows.item(i).id + " " +
		// results.rows.item(i).log);
		// }
		//
		// }, null);
		// });

	} catch (e) {
		error("deviceready: " + e.message);
	}
}

// on pageCreate *************************************
$(document).on("pagecreate", "#prva", function() {
	$(document).on("swiperight", "#prva", function(e) {
		if ($(".ui-page-active").jqmData("panel") !== "open") {
			if (e.type === "swipeleft") {
				$("#myPanel").panel("close");
			} else if (e.type === "swiperight") {
				$("#myPanel").panel("open");
			}
		}

	});

});// *******************************

// prva beforeShow ***************************************
$("#prva").on("beforepageshow", function(e) {

	$("[data-role='footer']").toolbar();
	$("[data-role='footer'] h4").html("");
	$("[data-role='footer']").show();

});

// prva beforeShow ***************************************
$("#prva").on("pageshow", function(e) {

	if (isLoging) {
		$("#startBtn").hide();
		$("#stopBtn").show();
	} else {
		$("#startBtn").show();
		$("#stopBtn").hide();
	}

});

// map Show ********************************************
$(document).on("pageinit", "#map_page", function() {
	mapInit();
});

$("#map_page").on("pageshow", function(e) {
	// detectBrowser();
	// map = mapInit();

});

// options Show ********************************************
$("#options_page").on("pageshow", function(e) {

	try {
		getOptions();
		var endpointInput = $("#endpointInput");
		endpointInput.val($.followme.options.remoteUrl);

		endpointInput.on("keyup blur", function(e) {
			trace("keyup #endpointInput: " + endpointInput.val());
			remoteAddress = endpointInput.val();
			$.followme.options.remoteUrl = endpointInput.val();
			saveOptions($.followme.options);
		});
		var user = getUser();
		var userInput = $("#user");
		userInput.val(user);

		userInput.on("keyup blur", function(e) {
			trace("keyup #user: " + userInput.val());
			setUser(userInput.val());
		});

		var pushInterval = $("#pushInterval");
		if ($.followme.options.pushInterval == null)
			$.followme.options.pushInterval = 3;
		pushInterval.val($.followme.options.pushInterval);
		pushInterval.slider("refresh");

		pushInterval.on("change", function(e) {
			trace("change #pushInterval: " + pushInterval.val());
			$.followme.options.pushInterval = pushInterval.val();
			saveOptions($.followme.options);
		});

		// panMap
		var panMap = $('#panMap');
		panMap.find('option[value="' + panToPosition + '"]').attr('selected', true);
		panMap.slider("refresh");

		panMap.change(function() {
			panToPosition = $(this).find(":selected").val();
			trace("panToPos:" + panToPosition);
		});

		// show polyLine
		var showPolyLineUI = $('#showPolyLine');
		showPolyLineUI.find('option[value="' + showPolyLine + '"]').attr('selected', true);
		showPolyLineUI.slider("refresh");

		showPolyLineUI.change(function() {
			showPolyLine = $(this).find(":selected").val();
		});

		$("#followers").val(followers);

	} catch (e) {
		trace("exception: " + e.message);
	}

});

// exit
$("#exitLnk").on("click", function(e) {
	trace("*** exit...");
	try {
		$("#user").removeData();
		$("#pushInterval").removeData();
		$("#endpointInput").removeData();
		$("#startBtn").removeData();
		$("#stopBtn").removeData();
		$("#myPanel").removeData();
		clearInterval(timer);
		map = timer = poly = null;
		socket.emit("logoff", app.getAppUser());
		socket.emit("disconnect", app.getAppUser());
		socket.removeListener('get_position');
		socket.disconnect();
		socket = null;

		isLoging = false;
		$("#msg").html("Stoped");
		$("#status").html("Logging is OFF");
		navigator.geolocation.clearWatch(watchID);
		$("#startBtn").show();
		$("#stopBtn").hide();
		app.clearUsers();

		cordova.plugins.backgroundMode.disable();

		navigator.app.exitApp();

	} catch (e) {
		trace("exit error: " + e.message);
	}

});

// start
$("#startBtn").on("click", function(e) {
	trace("*** start");

	isLoging = true;
	$("#msg").html("Start logging ...");
	$("#status").html("Logging is ON");
	$("#status").addClass("red");

	trace("logon: " + JSON.stringify(app.getAppUser()));
	socket.emit("logon", app.getAppUser());

	if (timer !== null)
		return;

	var positionToPush = null;
	var found = false;
	// geting gps position
	$("#status").html("Searching for setalites...");
	watchID = navigator.geolocation.watchPosition(function(position) {
		if (!found && position != null) {
			$("#status").html("Position found.");
			trace("Position found.");
			getLocation(position);
			found = true;
		}

		positionToPush = position;

		// continuos push
		if ($.followme.options.pushInterval == 0)
			getLocation(positionToPush);

		if (smartLog(position)){
			getLocation(position);
			$("#status").html("Smart logging is ON");
		}

	}, function(error) {
		trace(error);
		$("#status").html("Error finding position. " + error.message + ".");
	}, {
		frequency : 1000,
		enableHighAccuracy : true,
		maximumAge : 500,
		timeout : 15000
	});

	timer = setInterval(function() {
		
		if (!smartLog(position)){
			getLocation(positionToPush);
			$("#status").html("Logging is ON");
		}
	}, ($.followme.options.pushInterval * 1000));

	$("#startBtn").hide();
	$("#stopBtn").show();

	try {
		cordova.plugins.backgroundMode.setDefaults({
			text : 'Doing heavy tasks.'
		});
		cordova.plugins.backgroundMode.enable();

		cordova.plugins.backgroundMode.setDefaults({
			title : "Follow Me",
			ticker : "Follow Me is logging in the background...",
			text : "Logging is on..."
		})

	} catch (e) {
		error("Background mode: " + e.message);
	}

});

// stop
$("#stopBtn").on("click", function(e) {
	trace("logoff: " + JSON.stringify(app.getAppUser()));
	socket.emit("logoff", app.getAppUser());
	trace("*** stop");
	$("#status").removeClass("red");
	clearInterval(timer);
	timer = null;

	isLoging = false;
	$("#msg").html("Stoped");
	$("#status").html("Logging is OFF");
	navigator.geolocation.clearWatch(watchID);
	$("#startBtn").show();
	$("#stopBtn").hide();
	app.clearUsers();

	try {
		cordova.plugins.backgroundMode.disable();
	} catch (e) {
		error("Background mode: " + e.message);
	}

});

function getLocation(position) {

	trace("*position: " + JSON.stringify(position));
	getOptions();

	if (meMarker == null) {
		meMarker = new google.maps.Marker({
			position : new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
			icon : Utils.getIcon(getUser(), 3),
			map : map
		});
	} else {
		meMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
	}

	if (isLoging && position != null) {
		// pingGPS(position.coords);
		pushGPS(position);
		numPoints++;

		$("#list").html(
				"<li style='padding:6px'><a> LAT: " + position.coords.latitude + "<br> LON: " + position.coords.longitude
						+ "<br> Altitude: " + round(position.coords.altitude) + " m " + " <br> Acccuracy: "
						+ round(position.coords.accuracy) + " m<br/>Speed: " + convert(position.coords.speed) + "km/h <br> Heading: "
						+ round(position.coords.heading) + "<br> Num. points: " + numPoints
						+ "<span id='follows' class='ui-li-count' title='Followers'>" + followers + "</span></a></li>");

	}

}

// *****************************

function smartLog(position) {

	if (lastPosition == null) {
		lastPosition = position;
		return true;
	}

	if (position.coords.heading == lastPosition.coords.heading)
		return false;

	lastPosition = position;
	return true;
}

function mapInit() {
	trace("init map...");

	var myOptions = {
		zoom : 13,
		center : new google.maps.LatLng(46.069333, 14.515620),
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map"), myOptions);

	return map;
}

function panTo(data) {
	// trace("Racifeve: lat=" + position.lat + " lng=" + position.lng);
	if (map == undefined)
		mapInit();

	if (panToPosition === true)
		map.panTo(new google.maps.LatLng(data.lat, data.lng));

	var point = new google.maps.LatLng(data.lat, data.lng);

	if (app.getMarker(data.uuid) == null) {
		var marker = new google.maps.Marker({
			position : point,
			icon : Utils.getIcon(data.user),
			map : map
		});

		app.setMarker(data.uuid, marker);

	} else {
		app.getMarker(data.uuid).setPosition(point);
	}

	if (app.getPoly(data.uuid) == null) {
		var poly = new google.maps.Polyline({
			geodesic : true,
			strokeColor : '#FF0000',
			strokeOpacity : 0.9,
			strokeWeight : 2
		});

		app.setPoly(data.uuid, poly);

		if (showPolyLine === true)
			poly.setMap(map);
		else
			poly.setMap(null);
	}

	var path = app.getPoly(data.uuid).getPath();
	path.push(point);

	var info = ('User: ' + data.user + '<br>Latitude: ' + data.lat + '<br>' + 'Longitude: ' + data.lng + '<br>' + 'Altitude: ' + data.alt
			+ '<br>' + 'Accuracy: ' + data.accur + '<br>' + '<br>' + 'Speed: ' + data.speed + '<br>' + 'Timestamp: ' + new Date(data.tst));

	if (!infowindow) {
		infowindow = new google.maps.InfoWindow({
			content : info
		});
	} else {
		infowindow.setContent(info);
	}

	google.maps.event.addListener(markers[data.user], 'click', function() {
		infowindow.open(map, markers[data.user]);
	});

}
