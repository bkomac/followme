//config
var LogLevel = {
	ALL : 0,
	TRACE : 1,
	DEBUG : 2,
	INFO : 3,
	WARN : 4,
	ERROR : 5,
	FATAL : 6
};

// adb logcat CordovaLog:* *:S
// #######################################################

var remoteAddress = "http://ws.komac.si:4000";
var VERSION = "0.1.9";
var LOG_LEVEL = LogLevel.ERROR; // TRACE

// #######################################################

// security
var hash = "";
var websocket = null;
var panToPosition = true;

var user = null;

// Users
function OnlineUsers() {
	this.users = new Array();
	this.device = {};

	this.addUser = function(data) {
		trace("Ading user..." + data.socketId);
		var usr = new User();
		usr.userName = data.user;
		usr.socketId = data.socketId;
		usr.tst = new Date().getTime();
		usr.uuid = data.uuid;

		if (this.getUser(data.uuid) == null)
			this.users.push(usr);
	};

	this.getUser = function(uuid) {
		var currentTime = new Date().getTime();

		for (var int = 0; int < this.users.length; int++) {
			if (this.users[int].uuid == uuid)
				return this.users[int];
//			if ((this.users[int].tst + 10000) > currentTime)
//				this.users[int] = null;
		}
		return null;

	};

	this.clearUsers = function() {
		this.users = new Array();
	};

	this.getMarker = function(uuid) {
		return this.getUser(uuid).marker;
	};

	this.setMarker = function(uuid, marker) {
		var usr = this.getUser(uuid);
		if (usr != null) {
			echo(this.users[uuid], "user je:");

			usr.marker = marker;
		}
	};

	this.getDevice = function() {

		try {
			// probamo èe je device definiran, drugaèe vrže exception
			this.device = device;
			this.device.isOldAndroid = false;
			this.device.isLG = false;
			try {
				var ver = device.version.replace(/\./g, "");
				trace("ver:" + ver);
				var model = device.model + "";
				if (ver <= 410 && device.platform == 'Android') {
					this.device.isOldAndroid = true;
					trace("**This is old device! " + navigator.appName + " model:" + device.model + " ver:"
							+ device.version);
				}
				if (model.substring(0, 2) == "LG") {
					trace("This is LG ...");
					// setamo tudi property isOldAndroid na true (backward comp)
					this.device.isOldAndroid = true;
					this.device.isLG = true;
				}
			} catch (e) {
				error(e.message);
			}

		} catch (e) {
			debug("nastavimo device za development: " + e.message);
			this.device.uuid = "Debug uuid";
			this.device.platform = "Chrome";
			this.device.model = navigator.appName.substring(0, 40) + " " + navigator.appVersion.substring(0, 9);
			this.device.version = "35.0.1916.153 m";
			this.device.isLG = false;
		}
		try {
			trace("Device - device.platform:" + this.device.platform + " device.version:" + device.version
					+ " device.uuid:" + this.device.uuid + " device.model:" + this.device.model
					+ " navigator.appVersion: " + navigator.appVersion);
		} catch (e) {
			error(e.message);
		}
		return this.device;
	};

};

function User() {
	this.userName = "";
	this.uuid = null;
	this.points = [];
	this.marker = null;
	this.tst = null;
};

function securityToken(token) {
	hash = getHmac(token);
};

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

function pushGPS(position) {

	if (socket != null) {
		getOptions();
		var user = getUser();

		var trackpoint = position.coords;

		trace("PUSH: " + remoteAddress + " user:" + user);
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

		data.uuid = app.getDevice().uuid;

		try {
			trace("sending msg...");
			socket.emit('put_position', JSON.stringify(data));
		} catch (e) {
			trace("send error ... " + e.message);
		}
	} else {
		trace("Socket is null");

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
		trace("Napaka securitija! input=" + input + " err:" + e.message);
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
	this.uuid = null;
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

function echo(object, prepend) {
	if (prepend == undefined)
		prepend = "";
	trace(prepend + "->" + JSON.stringify(object));
}

function trace(msg) {
	console.log("TRACE: " + msg);
};
function debug(msg) {
	if (LOG_LEVEL <= LogLevel.DEBUG)
		console.log("DEBUG: " + msg);
}
function warn(msg) {
	if (LOG_LEVEL <= LogLevel.WARN)
		console.warn("WARN: " + msg);
}
function error(msg) {
	console.error("***ERROR: " + msg);
};

function initWebSockets() {
	trace("initWebSockets ...");

	// Open a WebSocket connection.
	websocket = new WebSocket(remoteAddress + "?gap");

	// Connected to server
	websocket.onopen = function(ev) {
		trace('ws:// Connected to server: ' + remoteAddress);
	};

	// Connection close
	websocket.onclose = function(ev) {
		trace('ws:// Disconnected fom: ' + remoteAddress);
	};

	// Message Receved
	websocket.onmessage = function(ev) {
		trace('ws:// Message ' + ev.data);
		// $("#status").html('ws:// Message: ' + ev.data);

		var ff = JSON.parse(ev.data);
		$("#followers").val(ff.f);
		followers = ff.f;
		trace("foloweres: " + followers);
	};

	// Error
	websocket.onerror = function(ev) {
		trace('ws:// Error ' + ev.data);
		$("#status").html('Error connecting to websocket.');
		$("#msg").html('Error connecting to websocket. Check your internet connection.');
	};

}
