let restify = require('restify');
let turf = require('turf');
var country_list = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua &amp; Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia &amp; Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Cape Verde","Cayman Islands","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cruise Ship","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyz Republic","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Namibia","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre &amp; Miquelon","Samoa","San Marino","Satellite","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","St Kitts &amp; Nevis","St Lucia","St Vincent","St. Lucia","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad &amp; Tobago","Tunisia","Turkey","Turkmenistan","Turks &amp; Caicos","Uganda","Ukraine","United Arab Emirates","United Kingdom","Uruguay","Uzbekistan","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];
let builder = require('botbuilder');
let locationDialogue = require('botbuilder-location');
let nodegeocoder = require('node-geocoder');

let geo_options = {
    provider: 'google'

}

let geocoder = nodegeocoder(geo_options);
let answer = {};

let randcountry = function () {
    geocoder.geocode(country_list[Math.floor((Math.random() * country_list.length) + 1)], function(err, res) {
        console.log(res);
        answer  = {
            name: res[0].formattedAddress,
            lat: res[0].latitude,
            lon: res[0].longitude
        }
    });
}
randcountry();

let server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
})

let connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
let bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.library(locationDialogue.createLibrary("api_key"));

//Dialogue
bot.dialog('/', [
    function(session) {
        locationDialogue.getLocation(session, {
            prompt: "Welcome to a location guessing game. ",
            requiredFields:
                locationDialogue.LocationRequiredFields.country 
        });
    },
    function(session, results) {
        if(results.response) {
            let place = results.response;
            let dist = Math.floor(getKM(place["geo"].latitude, place["geo"].longitude,
                answer.lat, answer.lon));

            session.send("You picked: " + locationDialogue.getFormattedAddressFromPlace(place, ", "));
            session.send("You're " + dist + " kilometres off target, " + 
                        "at a bearing of " + Math.floor(getBearing(place["geo"].latitude, place["geo"].longitude,answer.lat, answer.lon)));
           //for(let property in place) {
           //    session.send(property + " : " + place[property]); 
           //    if(property == "geo") {
           //        let geo = place["geo"]
           //        for(let prop in geo) {
           //            session.send(prop + " : " + geo[prop]);
           //        }
           //    }
           //}
            if(dist < 600) {
                session.send("Close enough! You win. The country was " + answer.name);
                randcountry();
            } else { 
                session.send("Too far, try again.");
            }
        }
    }
]);

// Everything below this was borrowed and a little edited

function getKM(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d;
}

function deg2rad(deg) {
      return deg * (Math.PI/180)
}

function radians(n) {
      return n * (Math.PI / 180);
}
function degrees(n) {
      return n * (180 / Math.PI);
}

function getBearing(startLat,startLong,endLat,endLong){
      startLat = radians(startLat);
      startLong = radians(startLong);
      endLat = radians(endLat);
      endLong = radians(endLong);

      var dLong = endLong - startLong;

      var dPhi = Math.log(Math.tan(endLat/2.0+Math.PI/4.0)/Math.tan(startLat/2.0+Math.PI/4.0));
      if (Math.abs(dLong) > Math.PI){
              if (dLong > 0.0)
                     dLong = -(2.0 * Math.PI - dLong);
              else
                     dLong = (2.0 * Math.PI + dLong);
            }

      return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

