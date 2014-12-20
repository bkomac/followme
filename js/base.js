//config

//REST base url
//var remoteAddress = "http://tracksbox.net:18080/followme/ws/";
// var remoteAddress = "http://cloud.komac.si/ws/";
//var remoteAddress = "http://doma.komac.si:18080/followme/ws/";
//var remoteAddress = "ws://doma.komac.si:18080/followme/pos";
//var remoteAddress = "ws://tracksbox.net:18080/followme/pos";

//var remoteAddress = "http://localhost:4000";
var remoteAddress = "http://doma.komac.si";
var VERSION = "0.1.5";

// security
var hash = "";
var websocket = null;

function securityToken(token) {
	hash = getHmac(token);
}

var Utils = {
	getIcon : function(user, color) {
		trace("***" + user);
		color = color || 1;
		if (user != null && user != "") {
			return "img/icon/letters_" + color + "/letter_" + user.substring(0, 1) + ".png";
		}

		return "img/icon/letters_1/letter_x.png";
	}
};

function trace(msg) {
	console.log("TRACE: " + msg);
}

function pushGPS(position) {

	if (socket != null) {
		getOptions();
		var user = getUser();

		var trackpoint = position.coords;

		console.log("PUSH: " + remoteAddress + " user:" + user);
		// $("#msg").html(
		// "PUSH: " + remoteAddress + "<br/>user: " + user + "<br/>tst: " +
		// position.timestamp
		// + "<br/>Update frequency: " + $.followme.options.pushInterval + "
		// s");

		var data = new Trackpoint();

		data.lat = trackpoint.latitude;
		data.lng = trackpoint.longitude;
		data.alt = trackpoint.altitude;
		data.user = user;

		try {
			data.uddi = device.uuid;
		} catch (e) {
			data.uddi = "TEST123";
		}

		try {
			console.log("sending msg...");
			socket.emit('put_position', JSON.stringify(data));
		} catch (e) {
			console.log("send error ... " + e.message);
		}
	} else {
		console.log("Socket is null");

	}

	data = user = null;
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
	this.uddi;
};

function convert(ms) {
	if (ms != null) {
		var kh = ms * 3.6;
		kh = Math.round(kh * 10) / 10;
		return kh;
	}
	return "";

}

function round(alt) {
	if (alt == null)
		return "";
	return Math.round(alt * 10) / 10;
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
		$("#status").html('Error connecting to websocket.');
		$("#msg").html('Error connecting to websocket. Check your internet connection.');
	};

}
