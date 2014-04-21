//config

//REST base url
//var remoteAddress = "http://tracksbox.net:18080/followme/ws/";
// var remoteAddress = "http://cloud.komac.si/ws/";
//var remoteAddress = "http://doma.komac.si:18080/followme/ws/";
//var remoteAddress = "ws://doma.komac.si:18080/followme/pos";
var remoteAddress = "ws://tracksbox.net:18080/followme/pos";

// security
var hash = "";
var websocket = null;

function securityToken(token) {
	hash = getHmac(token);
}

// preset ajax calls
// $.ajaxSetup({
// beforeSend : function(request) {
// request.setRequestHeader("Authority", hash);
// }
//
// });

function pushGPS(position) {

	if (websocket != null && websocket.readyState == 1) {
		getOptions();
		var user = getUser();
		
		var trackpoint = position.coords; 

		console.log("PUSH: " + remoteAddress + " user:" + user);
		$("#msg").html("PUSH: " + remoteAddress + "<br/>user: " + user + "<br/>tst: "+position.timestamp);

		var data = new Trackpoint();

		data.lat = trackpoint.latitude;
		data.lng = trackpoint.longitude;
		data.alt = trackpoint.altitude;
		data.user = user;

		try {
			console.log("status: " + websocket.readyState);
			websocket.send(JSON.stringify(data));
		} catch (e) {
			console.log("send error ... " + e.message);
			initWebSockets();
		}
	} else {
		websocket = null;
		initWebSockets();
	}
	data = user = null;
}

function pingGPS(trackpoint) {
	getOptions();
	var user = getUser();

	console.log("GET: " + $.followme.options.remoteUrl + " user:" + user);
	$("#msg").html("GET: " + $.followme.options.remoteUrl + " user:" + user);

	$.ajax({
		type : "GET",
		url : $.followme.options.remoteUrl,
		dataType : "json",
		jsonp : 'jsoncallback',
		crossDomain : true,
		cache : false,
		data : {
			lat : trackpoint.latitude,
			lon : trackpoint.longitude,
			altitude : trackpoint.altitude,
			user : user,
			speed : trackpoint.speed,
			accur : trackpoint.accuracy

		},

		error : function(xhr, ajaxOptions, thrownError) {
			console.log("error: " + thrownError);
		},
		success : function(data) {
			console.log("RESPONSE: " + JSON.stringify(data));
			$("#msg").append(" - RESPONSE: " + JSON.stringify(data));
			$("#followers").val(data.followers);
			$.followme.followers = data.followers;
		}
	});
}

function saveOptions(options) {
	localStorage.setItem("options", JSON.stringify(options));
	$.followme.options = JSON.parse(localStorage.getItem("options"));
}

function getOptions() {
	if (localStorage.getItem("options") != null) {
		$.followme.options = JSON.parse(localStorage.getItem("options"));
		remoteAddress = $.followme.options.remoteUrl;
	}
	return $.followme.options;
}

function getHmac(input) {
	var out = "";
	if (input == null)
		input = "";
	try {
		out = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(input + "", SECURITY_KEY));
	} catch (e) {
		console.log("Napaka securitija! input=" + input + " err:" + e.message);
	}
	return out;
}

// accessor methods
function getUser() {
	if (localStorage.getItem("user") != null)
		return JSON.parse(localStorage.getItem("user"));
	else
		return "android";
}

function setUser(user) {
	if (user != null) {
		localStorage.setItem("user", JSON.stringify(user));
	}
}

function getFrequency() {
	if (localStorage.getItem("user") != null)
		return JSON.parse(localStorage.getItem("user"));
	else
		return null;
}

function setFrequency(frequency) {
	if (frequency != null) {
		localStorage.setItem("frequency", JSON.stringify(frequency));
	}
}

function clearStorage() {
	sessionStorage.clear();
	localStorage.clear();

}

// entities
$.followme = {
	user : {
		username : null,
		name : null,
		uid : null,
		persist : false
	},
	options : {
		pushInterval : 3,
		remoteUrl : remoteAddress
	},
	followers : 0
};

var Trackpoint = function() {
	this.lat = 0;
	this.lng = 0;
	this.alt = 0;
	this.tst = null;
	this.accur = 0;
	this.speed = 0;
	this.user = "";
};

function convert(ms){
	if(ms!=null){
		var kh = ms * 3.6;
		kh = Math.round(kh * 10) / 10;
		return kh;
	}
	return "";
	
}

function round(alt){
	if(alt == null)
		return "";
	return  Math.round(alt * 10) / 10;
}
