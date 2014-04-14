var map;
var marker;
var infowindow;
var watchID;


// prva beforeShow
$("#prva").on("beforepageshow", function(e) {

	 google.load("maps", "3.8", {"callback": map, other_params: "sensor=true&language=en"});
	
	
	
});

//private

function map(){
    var latlng = new google.maps.LatLng(55.17, 23.76);
    var myOptions = {
      zoom: 6,
      center: latlng,
      streetViewControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true
    };
    map = new google.maps.Map(document.getElementById("map"), myOptions);
     
    google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
        //get geoposition once
        //navigator.geolocation.getCurrentPosition(geo_success, geo_error, { maximumAge: 5000, timeout: 5000, enableHighAccuracy: true });
        //watch for geoposition change
        watchID = navigator.geolocation.watchPosition(geo_success, geo_error, { maximumAge: 5000, timeout: 5000, enableHighAccuracy: true });  
    });
}

function geo_error(error){
    //comment
    alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}
 
function geo_success(position) {
     
    map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
    map.setZoom(15);
 
    var info =
    ('Latitude: '         + position.coords.latitude          + '<br>' +
    'Longitude: '         + position.coords.longitude         + '<br>' +
    'Altitude: '          + position.coords.altitude          + '<br>' +
    'Accuracy: '          + position.coords.accuracy          + '<br>' +
    'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '<br>' +
    'Heading: '           + position.coords.heading           + '<br>' +
    'Speed: '             + position.coords.speed             + '<br>' +
    'Timestamp: '         + new Date(position.timestamp));
 
    var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    if(!marker){
        //create marker
        marker = new google.maps.Marker({
            position: point,
            map: map
        });
    }else{
        //move marker to new position
        marker.setPosition(point);
    }
    if(!infowindow){
        infowindow = new google.maps.InfoWindow({
            content: info
        });
    }else{
        infowindow.setContent(info);
    }
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map,marker);
    });
}