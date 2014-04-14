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

// jQuery document reddy
function documentready() {
	console.log("deviceready...");
	try {

		navigator.splashscreen.hide();
	} catch (e) {
		// TODO: handle exception
	}
}

var map;
var marker;
var infowindow;
var watchID;
var tracking_data = [];

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

});

// prva Show ********************************************
$("#map_page").on("pageshow", function(e) {
	detectBrowser();
});

$("#startBtn").on(
		"click",
		function(e) {
			console.log("*** start");
			$("#msg").html("Start loging ...");

			// Start tracking the User
			watchID = navigator.geolocation.watchPosition(

			// Success
			function(position) {
				tracking_data.push(position);
				console.log("*" + JSON.stringify(position));
				$("#list").html(
						"<li> LAT: " + position.coords.latitude + "<br> LON: "
								+ position.coords.longitude + "<br> alt: "
								+ position.coords.altitude + "<br> acccur: "
								+ position.coords.accuracy + "</li>");
				
				pingGPS(position.coords);
			},

			// Error
			function(error) {
				console.log(error);
				$("#msg").html(error);
			},

			// Settings
			{
				frequency : 500,
				enableHighAccuracy : true
			});

		});

$("#stopBtn").on("click", function(e) {
	console.log("*** stop");
	$("#msg").html("Stop loging ...");
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
			enableHighAccuracy : true
		});

	});

}

function geo_error(error) {
	// comment
	alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

function geo_success(position) {

	// map.setCenter(new google.maps.LatLng(position.coords.latitude,
	// position.coords.longitude));

	map.panTo(new google.maps.LatLng(position.coords.latitude,
			position.coords.longitude));
	// map.setZoom(15);

	var info = ('Latitude: ' + position.coords.latitude + '<br>'
			+ 'Longitude: ' + position.coords.longitude + '<br>' + 'Altitude: '
			+ position.coords.altitude + '<br>' + 'Accuracy: '
			+ position.coords.accuracy + '<br>' + 'Altitude Accuracy: '
			+ position.coords.altitudeAccuracy + '<br>' + 'Heading: '
			+ position.coords.heading + '<br>' + 'Speed: '
			+ position.coords.speed + '<br>' + 'Timestamp: ' + new Date(
			position.timestamp));

	var point = new google.maps.LatLng(position.coords.latitude,
			position.coords.longitude);
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
}

function getRealContentHeight() {
	var header = $.mobile.activePage.find("div[data-role='header']:visible");
	var footer = $.mobile.activePage.find("div[data-role='footer']:visible");
	var content = $.mobile.activePage
			.find("div[data-role='content']:visible:visible");
	var viewport_height = $(window).height();

	var content_height = viewport_height - header.outerHeight()
			- footer.outerHeight();
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
