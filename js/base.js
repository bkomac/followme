//config

//REST base url
var remoteAddress = "http://tracksbox.net:18080/followme/ws/";
//var remoteAddress = "http://cloud.komac.si/ws/";

// security
var hash = "";
var SECURITY_KEY = "4cnr374cn874r8743FRE74zri34rnzc4zri34zr43mxr3fhslhaf87448fh48438mfx";

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

function pingGPS(trackpoint) {

	$.ajax({
		type : "GET",
		url : remoteAddress,
		dataType : "json",
		jsonp : 'jsoncallback',
		crossDomain : true,
		cache : false,
		data : {
			lat : trackpoint.latitude,
			lon : trackpoint.longitude,
			altitude : trackpoint.altitude
		},

		error : function(xhr, ajaxOptions, thrownError) {
			console.log("error: " + thrownError);
		},
		success : function(data) {
			console.log("GET: " + JSON.stringify(data));
		}
	});
}

function saveOptions(options) {
	localStorage.setItem("options", JSON.stringify(options));
	$.followme.options = JSON.parse(localStorage.getItem("options"));
}

function getOptions() {
	$.followme.options = JSON.parse(localStorage.getItem("options"));
	return $.followme.options;
}

function getHmac(input) {
	var out = "";
	if (input == null)
		input = "";
	try {
		out = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(input + "",
				SECURITY_KEY));
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
		return null;
}

function setUser(user) {
	if (user != null) {
		sessionStorage.setItem("user", JSON.stringify(user));
		localStorage.setItem("user", JSON.stringify(user));
		$.estoritve.user = user;
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
		pushInterval : 1000
	}
};

var trackpoint = {
	lat : null,
	lng : null,
	alt : null,
	tst : null,
	accur : null,
	speed : null
};
