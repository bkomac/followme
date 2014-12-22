function init() {
	console.log("init...");
	document.addEventListener("deviceready", deviceready);
}

// phonegap ready
function deviceready() {
	// navigator.splashscreen.show();

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

var poly = null;

var followers = 0;

var socket;
var app;

// jQuery document ready
function documentready() {
	console.log("deviceready...");
	try {
		app = new OnlineUsers();
		
		$("#status").html("version " + VERSION);
		socket = io(remoteAddress);

		navigator.splashscreen.hide();
		StatusBar.overlaysWebView(false);

		clearInterval(timer);
	} catch (e) {
		// TODO: handle exception
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

	document.addEventListener("menubutton", function() {
		$("#myPanel").panel("open");
	}, false);

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
			console.log("keyup #endpointInput: " + endpointInput.val());
			remoteAddress = endpointInput.val();
			$.followme.options.remoteUrl = endpointInput.val();
			saveOptions($.followme.options);
		});
		var user = getUser();
		var userInput = $("#user");
		userInput.val(user);

		userInput.on("keyup blur", function(e) {
			console.log("keyup #user: " + userInput.val());
			setUser(userInput.val());
		});

		var pushInterval = $("#pushInterval");
		if ($.followme.options.pushInterval == null || $.followme.options.pushInterval == 0)
			$.followme.options.pushInterval = 2;
		pushInterval.val($.followme.options.pushInterval);
		pushInterval.slider("refresh");

		pushInterval.on("change", function(e) {
			console.log("change #pushInterval: " + pushInterval.val());
			$.followme.options.pushInterval = pushInterval.val();
			saveOptions($.followme.options);
		});

		$("#followers").val(followers);

	} catch (e) {
		console.log("exception: " + e.message);
	}

});

// exit
$("#exitLnk").on("click", function(e) {
	console.log("*** exit...");
	try {
		$("#user").removeData();
		$("#pushInterval").removeData();
		$("#endpointInput").removeData();
		$("#startBtn").removeData();
		$("#stopBtn").removeData();
		$("#myPanel").removeData();
		clearInterval(timer);
		map = timer = poly = null;
		// socket.emit("disconect");
		// socket.disconnect();
		socket = null;
		navigator.app.exitApp();

	} catch (e) {
		console.log("exit error: " + e.message);
	}

});

// start
$("#startBtn").on("click", function(e) {
	console.log("*** start");

	isLoging = true;
	$("#msg").html("Start logging ...");
	$("#status").html("Logging is ON");
	$("#status").addClass("red");

	socket.on('get_position', function(rdata) {

		var data = JSON.parse(rdata);
		echo(data, "node");
		console.log("Recieve position: " + rdata);
		$('#msg').html('<p><b>' + data.user + '</b> emits ...</p>');

		console.log("user=" + getUser() + " data.usr=" + data.user);
		if (data != null && data.user != getUser()){
			app.addUser(data);
			panTo(data);
		}
			
	});

	if (timer !== null)
		return;

	var positionToPush = null;
	var found = false;
	// geting gps position
	$("#status").html("Searching for setalites...");
	watchID = navigator.geolocation.watchPosition(function(position) {
		if (!found) {
			$("#status").html("Position found.");
			console.log("Position found.");
			found = true;
		}
		positionToPush = position;

	}, function(error) {
		console.log(error);
		$("#status").html("Error finding position. " + error.message + ".");
	}, {
		frequency : 3000,
		enableHighAccuracy : true,
		maximumAge : 1000,
		timeout : 15000
	});

	timer = setInterval(function() {
		$("#status").html("Logging is ON");
		getLocation(positionToPush);
	}, ($.followme.options.pushInterval * 1000));

	$("#startBtn").hide();
	$("#stopBtn").show();
});

// stop
$("#stopBtn").on("click", function(e) {
	socket.emit("disconect");
	console.log("*** stop");
	$("#status").removeClass("red");
	clearInterval(timer);
	timer = null;

	isLoging = false;
	$("#msg").html("Stoped");
	$("#status").html("Logging is OFF");
	navigator.geolocation.clearWatch(watchID);
	$("#startBtn").show();
	$("#stopBtn").hide();
});

function getLocation(position) {
	// console.log("Get location ...");
	// watchID = navigator.geolocation.getCurrentPosition(function(position) {

	// console.log("*position: " + JSON.stringify(position));
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

		$("#list").html(
				"<li style='padding:6px'><a> LAT: " + position.coords.latitude + "<br> LON: "
						+ position.coords.longitude + "<br> Altitude: " + round(position.coords.altitude) + " m ("
						+ round(position.coords.altitudeAccuracy) + " m) <br> Acccuracy: " + position.coords.accuracy
						+ " m<br/>Speed: " + convert(position.coords.speed)
						+ "km/h <span id='follows' class='ui-li-count' title='Followers'>" + followers
						+ "</span></a></li>");

	}
	//
	// }, function(error) {
	// console.log(error);
	// $("#msg").html(error);
	// $("#status").html("Error finding position. " + error.message + ".");
	// }, // Settings
	// {
	// frequency : ($.followme.options.pushInterval * 1000),
	// enableHighAccuracy : true,
	// maximumAge : 5000,
	// timeout : 5000
	// });
}

// *****************************

function mapInit() {
	console.log("init map...");

	var myOptions = {
		zoom : 16,
		center : new google.maps.LatLng(46.0675981, 14.411458),
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map"), myOptions);

	return map;
}

function panTo(data) {
	// console.log("Racifeve: lat=" + position.lat + " lng=" + position.lng);
	if (map == undefined)
		mapInit();

	if (panToPosition)
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

	// map.addOverlay(marker);

	var info = ('User: ' + data.user + '<br>Latitude: ' + data.lat + '<br>' + 'Longitude: ' + data.lng
			+ '<br>' + 'Altitude: ' + data.alt + '<br>' + 'Accuracy: ' + data.accur + '<br>' + '<br>'
			+ 'Speed: ' + data.speed + '<br>' + 'Timestamp: ' + new Date(data.tst));

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

	if (poly == null) {
		poly = new google.maps.Polyline({
			geodesic : true,
			strokeColor : '#FF0000',
			strokeOpacity : 1.0,
			strokeWeight : 2
		});

		poly.setMap(map);
	}

	var path = poly.getPath();
	path.push(data.coords);
}
