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
var VERSION = "1.0.4";
var LOG_LEVEL = LogLevel.ERROR; // TRACE

// #######################################################

// security
var hash = "";
var websocket = null;
var panToPosition = true;
var showPolyLine = false;

var user = null;

// Users
function OnlineUsers() {
	this.users = new Array();
	this.appUser = new User();
	this.device = null;
	this.battery = {
		"level" : 100,
		"isPlugged" : true
	};

	this.getAppUser = function() {

		this.appUser.userName = JSON.parse(localStorage.getItem("user"));
		this.appUser.user = this.appUser.userName;
		this.getDevice();

		this.appUser.uuid = app.device.uuid;

		trace("UUDI=" + this.appUser.uuid);

		return this.appUser;
	};

	this.addUser = function(data) {
		trace("Adding user..." + data.socketId);
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
			trace(this.users[int].userName + "TST:" + this.users[int].tst + " " + currentTime);

			// pucamo stare markerje
			if ((this.users[int].tst + 15000) < currentTime) {
				trace("brišem..." + this.users[int].userName);
				this.users[int].marker.setMap(null);
				this.users.splice(int, 1);
				return;
			}

			if (this.users[int].uuid == uuid) {
				this.users[int].tst = new Date().getTime();
				return this.users[int];
			}

		}//
		return null;

	};

	this.clearUsers = function() {
		this.clearAllMarkers();
		this.clearAllPolys();
		this.users = new Array();
	};

	this.getMarker = function(uuid) {
		return this.getUser(uuid).marker;
	};

	this.clearAllMarkers = function() {
		for (var int = 0; int < this.users.length; int++) {
			trace("Clearing markers: " + this.users[int].userName);
			this.users[int].marker.setMap(null);
		}
	};

	this.setMarker = function(uuid, marker) {
		var usr = this.getUser(uuid);
		if (usr != null) {
			echo(this.users[uuid], "user je:");
			usr.marker = marker;
		}
	};

	this.getPoly = function(uuid) {
		return this.getUser(uuid).poly;
	};

	this.setPoly = function(uuid, poly) {
		var usr = this.getUser(uuid);
		if (usr != null) {
			echo(this.users[uuid], "user je:");
			usr.poly = poly;
		}
	};

	this.clearAllPolys = function() {
		for (var int = 0; int < this.users.length; int++) {
			trace("Clearing polys: " + this.users[int].userName);
			this.users[int].poly.setMap(null);
		}
	};

	this.getDevice = function() {

		try {
			// probamo če je device definiran, drugače vrže exception
			this.device = device;
			this.device.isOldAndroid = false;
			this.device.isLG = false;
			try {
				var ver = device.version.replace(/\./g, "");
				trace("ver:" + ver);
				var model = device.model + "";
				if (ver <= 410 && device.platform == 'Android') {
					this.device.isOldAndroid = true;
					trace("**This is old device! " + navigator.appName + " model:" + device.model + " ver:" + device.version);
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
			if (this.device == undefined || this.device.uuid == undefined) {
				trace("nastavimo device za development: " + e.message);
				this.device = {};
				this.device.uuid = new Date().getTime();
				this.device.platform = "Chrome";
				this.device.model = navigator.appName.substring(0, 40) + " " + navigator.appVersion.substring(0, 9);
				this.device.version = "35.0.1916.153 m";
				this.device.isLG = false;
				trace("**UUDI=" + this.device.uuid);
			}
		}
		try {
			trace("***Device - device.platform:" + this.device.platform + " device.version:" + device.version + " device.uuid:"
					+ this.device.uuid + " device.model:" + this.device.model + " navigator.appVersion: " + navigator.appVersion);
		} catch (e) {
			error(e.message);
		}
		trace("****UUDI=" + this.device.uuid);
		return this.device;
	};

	this.onBatteryStatus = function(info) {
		trace("Battery Level: " + info.level + " isPlugged: " + info.isPlugged);
		app.battery = info;
	}

};

function User() {
	this.userName = "";
	this.user = "";
	this.uuid = null;
	this.poly = null;
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
		data.tst = new Date().getTime();
		data.speed = trackpoint.speed;
		data.accuracy = trackpoint.accuracy;
		data.heading = trackpoint.heading;

		data.uuid = app.getDevice().uuid;

		data.battery = {};
		data.battery.level = app.battery.level;
		data.battery.isPlugged = app.battery.isPlugged;
		trace("battery:" + app.battery.level);

		try {
			trace("sending msg... " + JSON.stringify(data));
			socket.emit('put_position', JSON.stringify(data));
		} catch (e) {
			trace("send error ... " + e.message);
		}
	} else {
		error("Socket is null...");
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

function toast(msg, timoutInMilis) {
	var timeout = timoutInMilis || 3000;

	$("<div class='ui-loader ui-overlay-shadow ui-body-c ui-corner-all' style='ovelay: hidden'><h4>" + msg + "</h4></div>").css({
		display : "block",
		opacity : 0.98,
		position : "fixed",
		padding : "7px",
		"text-align" : "center",
		width : "270px",
		left : ($(window).width() - 284) / 2,
		top : $(window).height() / 3
	}).appendTo($.mobile.pageContainer).delay(timeout).fadeOut(400, function() {
		$(this).remove();
	});
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

