//config
// https://perun.informatika.si/eRacunMOB/rs/uporabnik/login/bkomac:BOKO9085
// http://komac.si/lab/api/rest.json
// http://192.168.1.123:9086/eRacunMOB/rs/uporabnik/login

//REST base url
var remoteAddress = "";

// security
var hash = "";
var SECURITY_KEY = "4cnr374cn874r8743FRE74zri34rnzc4zri34zr43mxr3fhslhaf87448fh48438mfx";

function securityToken(token) {
	hash = getHmac(token);
}

// preset ajax calls
$.ajaxSetup({
	beforeSend : function(request) {
		request.setRequestHeader("Authority", hash);
	}

});

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
	}

};

