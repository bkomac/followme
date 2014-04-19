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

// jQuery document reddy
function documentready() {
	console.log("deviceready...");
	try {

		navigator.splashscreen.hide();
		
		document.addEventListener("menubutton", function() {
			$("#myPanel").panel("open");
		}, false);
		
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

});// *******************************

// prva beforeShow ***************************************
$("#prva").on("beforepageshow", function(e) {
	$("[data-role='footer']").toolbar();
	$("[data-role='footer'] h4").html("");
	$("[data-role='footer']").show();
	
	if(isLoging){
		$("#startBtn").hide();
		$("#stopBtn").show();
	}else{
		$("#startBtn").show();
		$("#stopBtn").hide();
	}
});

// prva Show ********************************************
$("#map_page").on("pageshow", function(e) {
	detectBrowser();
	//mapInit();
});

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

	} catch (e) {
		console.log("exception: " + e.message);
	}

});

$("#exitLnk").on("click", function(e) {
	console.log("*** exit...");
	map = timer = poly = null;
	navigator.app.exitApp();
	
});

$("#startBtn").on("click", function(e) {
	console.log("*** start");

	isLoging = true;
	$("#msg").html("Start logging ...");
	$("#status").html("Logging ON");

	if (timer !== null)
		return;
	timer = setInterval(function() {
		getLocation();
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
	$("#status").html("Logging OFF");
	navigator.geolocation.clearWatch(watchID);
	$("#startBtn").show();
	$("#stopBtn").hide();
});

function getLocation() {
	console.log("Get location ...");
	watchID = navigator.geolocation.getCurrentPosition(function(position) {

		console.log("*position: " + JSON.stringify(position));
		getOptions();

		$("#list").html(
				"<li style='padding:6px'><a> LAT: " + position.coords.latitude + "<br> LON: " + position.coords.longitude + "<br> alt: "
						+ position.coords.altitude + "<br> acccur: " + position.coords.accuracy + "<span class='ui-li-count'>"+$.followme.followers+"</span></a></li>");
		
		if (isLoging) {
			pingGPS(position.coords);

			$("#msg").append(" - frequency: " + $.followme.options.pushInterval);
		}

	}, function(error) {
		console.log(error);
		$("#msg").html(error);
	}, // Settings
	{
		frequency : ($.followme.options.pushInterval * 1000),
		enableHighAccuracy : true,
		maximumAge : 5000,
		timeout : 5000
	});
}

$("#startBtnX").on(
		"click",
		function(e) {
			console.log("*** start");

			isLoging = true;
			$("#msg").html("Start logging ...");
			$("#status").html("Logging ON");

			// Start tracking the User
			watchID = navigator.geolocation.watchPosition(

			// Success
			function(position) {
				// tracking_data.push(position);
				console.log("*position: " + JSON.stringify(position));
				getOptions();

				$("#list").html(
						"<li> LAT: " + position.coords.latitude + "<br> LON: " + position.coords.longitude
								+ "<br> alt: " + position.coords.altitude + "<br> acccur: " + position.coords.accuracy
								+ "</li>");

				if (isLoging) {
					pingGPS(position.coords);

					$("#msg").append(" - frequency: " + $.followme.options.pushInterval);
				}

			},

			// Error
			function(error) {
				console.log(error);
				$("#msg").html(error);
			},

			// Settings
			{
				frequency : ($.followme.options.pushInterval * 1000),
				enableHighAccuracy : false,
				maximumAge : 5000,
				timeout : 5000
			});

		});

$("#stopBtnX").on("click", function(e) {
	console.log("*** stop");
	isLoging = false;
	$("#msg").html("Stoped");
	$("#status").html("Logging OFF");
	navigator.geolocation.clearWatch(watchID);

}); // *****************************

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
	alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
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

google.maps.event.addDomListener(window, 'load', mapInit);
