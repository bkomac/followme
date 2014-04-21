function init() {
	console.log("inti...");
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
var marker;
var infowindow;
var watchID;
var isLoging = false;
var timer = null;

var poly = null;

var followers = 0;

// jQuery document ready
function documentready() {
	console.log("deviceready...");
	try {

		navigator.splashscreen.hide();

		document.addEventListener("menubutton", function() {
			$("#myPanel").panel("open");
		}, false);

		clearInterval(timer);
	} catch (e) {
		// TODO: handle exception
	}

	if (websocket == null) {
		initWebSockets();
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

// prva Show ********************************************
// $("#map_page").on("pageshow", function(e) {
// // detectBrowser();
// // mapInit();
// });

// options Show ********************************************
$("#options_page").on("pageshow", function(e) {

	try {
		getOptions();

		$("#endpointInput").val($.followme.options.remoteUrl);

		$("#endpointInput").on("keyup blur", function(e) {
			console.log("keyup #endpointInput: " + $("#endpointInput").val());
			remoteAddress = $("#endpointInput").val();
			$.followme.options.remoteUrl = $("#endpointInput").val();
			saveOptions($.followme.options);
		});
		var user = getUser();
		$("#user").val(user);

		$("#user").on("keyup blur", function(e) {
			console.log("keyup #user: " + $("#user").val());
			setUser($("#user").val());
		});

		if ($.followme.options.pushInterval == null || $.followme.options.pushInterval == 0)
			$.followme.options.pushInterval = 2;
		$("#pushInterval").val($.followme.options.pushInterval);

		$("#pushInterval").on("change", function(e) {
			console.log("change #pushInterval: " + $("#pushInterval").val());
			$.followme.options.pushInterval = $("#pushInterval").val();
			saveOptions($.followme.options);
		});

		$("#followers").val(followers);

	} catch (e) {
		console.log("exception: " + e.message);
	}

});

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
		navigator.app.exitApp();

	} catch (e) {
		console.log("exit error: " + e.message);
	}

});

$("#startBtn").on("click", function(e) {
	console.log("*** start");

	isLoging = true;
	$("#msg").html("Start logging ...");
	$("#status").html("Logging is ON");

	if (timer !== null)
		return;

	var positionToPush = null;
	var found = false;
	// geting gps position
	$("#status").html("Searching for setalites...");
	watchID = navigator.geolocation.watchPosition(function(position) {
		if(!found){
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

$("#stopBtn").on("click", function(e) {
	console.log("*** stop");
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
	console.log("Get location ...");
	// watchID = navigator.geolocation.getCurrentPosition(function(position) {

	console.log("*position: " + JSON.stringify(position));
	getOptions();

	if (isLoging && position != null) {
		// pingGPS(position.coords);
		pushGPS(position);

		$("#list").html(
				"<li style='padding:6px'><a> LAT: " + position.coords.latitude + "<br> LON: "
						+ position.coords.longitude + "<br> Altitude: " + round(position.coords.altitude) + " m ("
						+ round(position.coords.altitudeAccuracy) + " m) <br> Acccuracy: " + position.coords.accuracy+
						" m<br/>Speed: "+convert(position.coords.speed)
						+ "km/h <span id='follows' class='ui-li-count' title='Followers'>" + followers + "</span></a></li>");

		$("#msg").append(" - frequency: " + $.followme.options.pushInterval);
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

	var mapOptions = {
		zoom : 12,
		center : new google.maps.LatLng(46.0675981, 14.411458)
	};
	map = new google.maps.Map(document.getElementById('map'), mapOptions);

	google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
		watchID = navigator.geolocation.watchPosition(geo_success, geo_error, {
			maximumAge : 5000,
			timeout : 5000,
			enableHighAccuracy : false,
			frequency : 3000
		});

	});

}

function geo_error(error) {
	// comment
	console.log("geo error: " + error.message);
	$("#status").html("geo error: " + error.message);
	// alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

function geo_success(position) {

	map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));

	var info = ('Latitude: ' + position.coords.latitude + '<br>' + 'Longitude: ' + position.coords.longitude + '<br>'
			+ 'Altitude: ' + position.coords.altitude + '<br>' + 'Accuracy: ' + position.coords.accuracy + '<br>'
			+ 'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '<br>' + 'Heading: ' + position.coords.heading
			+ '<br>' + 'Speed: ' + position.coords.speed + '<br>' + 'Timestamp: ' + new Date(position.timestamp));

	var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	if (!marker) {
		// create marker
		marker = new google.maps.Marker({
			position : point,
			map : map
		});
	} else {
		// move marker to new position
		marker.setPosition(point);
	}
	if (!infowindow) {
		infowindow = new google.maps.InfoWindow({
			content : info
		});
	} else {
		infowindow.setContent(info);
	}

	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(map, marker);
	});

	if (poly == null) {
		poly = new google.maps.Polyline({
			geodesic : true,
			strokeColor : '#FF0000',
			strokeOpacity : 1.0,
			strokeWeight : 2
		});

		// poly.setMap(map);
	}

	var path = poly.getPath();
	path.push(position.coords);
}

function getRealContentHeight() {
	var header = $.mobile.activePage.find("div[data-role='header']:visible");
	var footer = $.mobile.activePage.find("div[data-role='footer']:visible");
	var content = $.mobile.activePage.find("div[data-role='content']:visible:visible");
	var viewport_height = $(window).height();

	var content_height = viewport_height - header.outerHeight() - footer.outerHeight();
	if ((content.outerHeight() - header.outerHeight() - footer.outerHeight()) <= viewport_height) {
		content_height -= (content.outerHeight() - content.height());
	}
	return content_height;
}

function detectBrowser() {
	var useragent = navigator.userAgent;
	var mapdiv = document.getElementById("map");

	if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1) {
		mapdiv.style.width = '100%';
		mapdiv.style.height = getRealContentHeight() + " px";
	} else {
		mapdiv.style.height = '500px';
	}
}

function initWebSockets() {
	console.log("initWebSockets ...");

	// Open a WebSocket connection.
	websocket = new WebSocket(remoteAddress + "?gap");

	// Connected to server
	websocket.onopen = function(ev) {
		console.log('ws:// Connected to server: ' + remoteAddress);
	};

	// Connection close
	websocket.onclose = function(ev) {
		console.log('ws:// Disconnected fom: ' + remoteAddress);
	};

	// Message Receved
	websocket.onmessage = function(ev) {
		console.log('ws:// Message ' + ev.data);
		// $("#status").html('ws:// Message: ' + ev.data);

		var ff = JSON.parse(ev.data);
		$("#followers").val(ff.f);
		followers = ff.f;
		console.log("foloweres: " + followers);
	};

	// Error
	websocket.onerror = function(ev) {
		console.log('ws:// Error ' + ev.data);
		$("#status").html('ws:// Error: ' + ev.data);
	};

}
