var icons_path = "http://maps.google.com/mapfiles/kml/pal4/";
var icons = ["icon62.png", "icon31.png", "icon15.png"];
var init_geo = {lat: 50.082736, lng: 14.422212};
var road = [];


loadJSON("roads/road1.json", function (data) {
    road = data;
});

var car_list = {
    /*car_1: {
        marker: null,
        geo: {lat: 50.082736, lng: 14.422212},
        icon: icons_path+icons[0]
    },
    car_2: {
        marker: null,
        geo: {lat: 50.082436, lng: 14.423212},
        icon: icons_path+icons[1]
    },
    car_3: {
        marker: null,
        geo: {lat: 50.082336, lng: 14.423412},
        icon: icons_path+icons[2]
    }*/
};

var current = null;

function setActual(id)
{
    current = id;
}


function initMap()
{
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 20,
        center: init_geo
    });

    for(var key in car_list)
    {
        car_list[key].marker = new google.maps.Marker({
            position: car_list[key].geo,
            map: map,
            icon: car_list[key].icon
        });
    }

    document.getElementById("map").style.height = window.innerHeight + "px";

    /*var i = 0;

    setInterval(function () {
        i++;
        if(i % 198 == 0)
        {
            i = 0;
        }

        setMarkerData(car_list["car_1"].marker, {
            icon: parseInt((Math.random()*3)),
            geo: road[i]
        });
    }, 100);*/

    function setMarkerData(marker, data)
    {
        for(var i in data)
        {
            if(i === "icon")
            {
                marker.setIcon(icons_path+icons[data[i]]);
            }
            else if(i === "geo")
            {
                marker.setPosition(data[i]);
            }
        }
    }

    var ws = new WebSocket("ws://localhost:8080/connect");

    ws.onmessage = function (evt)
    {
        var msg = JSON.parse(evt.data);
        if(!car_list.hasOwnProperty(msg.vehicle_uuid))
        {
            car_list[msg.vehicle_uuid] = {};
            car_list[msg.vehicle_uuid].marker = new google.maps.Marker({
                position: msg.vehicle_data.geo,
                map: map,
                icon: "http://maps.google.com/mapfiles/kml/pal4/icon62.png"
            });
        }

        /*if(!current)
        {
            current = msg.vehicle_uuid;

        }*/

        if(current !== null && current === msg.vehicle_uuid)
        {
            map.setCenter(msg.vehicle_data.geo);
            renderGauge(msg.vehicle_data.speed !== 0 ? parseFloat(parseInt(msg.vehicle_data.speed) + Math.random()*1.3) : 0);
        }

        for(var i in msg)
        {
            car_list[msg.vehicle_uuid][i] = msg[i];
        }


        renderData("left", car_list);


        setMarkerData(car_list[msg.vehicle_uuid].marker, {
            icon: 0,
            geo: car_list[msg.vehicle_uuid].vehicle_data.geo
        });

    };

    function renderData(id, data)
    {
        var str = "";
        var info = "";
        var distance = 0;
        for(var j in data)
        {
            /*if(current !== msg.vehicle_uuid)
             {*/
            if(current)
            {
                distance = calcCrow(data[j].vehicle_data.geo.lat, data[j].vehicle_data.geo.lng, data[current].vehicle_data.geo.lat, data[current].vehicle_data.geo.lng);

                if(distance < 0.5 && distance > 0)
                {
                    info = info + "<div class=\"in\"><h3 style='color: white;'>Beware incoming vehicle</h3>" +
                        "<b>Reasons: </b> " + formatReasons(data[j].driver_data.moods) + "<br/>" +
                        "<b>Current speed: </b>" + data[j].vehicle_data.speed + "km/h<br/>" +
                        "<b>Distance: </b>" + distance.toFixed(3) + "km" +
                        "<br><br>Leave a safe distance</br></div>";
                }
            }

            str = str + "<div class=\"in"+ (data[j].vehicle_uuid === current ? ' active' : '') +"\" onclick=\"setActual('"+data[j].vehicle_uuid+"')\">" +
            "<h3>"+ data[j].vehicle_uuid +"</h3>" +
            "<b>Position: </b> H" + data[j].vehicle_data.geo.lat + " V" + data[j].vehicle_data.geo.lng + "<br>" +
            "<b>Tire wear: </b>" + parseFloat(data[j].vehicle_data.tire_wear) * 100 + "%<br>" +
            "<b>Weight: </b>" + data[j].vehicle_data.weight + "%<br>" +
            "<b>Distance: </b>" + distance.toFixed(3) + "km" +
            "</div>";

            //}
        }

        document.getElementById("right").innerHTML = info;

        document.getElementById(id).innerHTML = str;
    }

    function formatReasons(reasons)
    {
        var out = "<ul>";
        for(var i in reasons)
        {
            out += "<li>"+reasons[i]+"</li>";
        }
        return out + "</ul>"
    }

    function renderGauge(speed)
    {
        google.charts.load('current', {'packages':['gauge']});
        google.charts.setOnLoadCallback(drawChart);

        function drawChart()
        {
            var data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['[Km/h]', speed],
            ]);

            var options = {
                width: 400, height: 220,
                redFrom: 90, redTo: 200,
                yellowFrom:50, yellowTo: 90,
                minorTicks: 5,
                max: 200
            };

            var chart = new google.visualization.Gauge(document.getElementById('chart_div'));

            chart.draw(data, options);
        }
    }
}

function calcCrow(lat1, lon1, lat2, lon2)
{
    var R = 6371; // km
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}

function loadJSON(name, callback)
{
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', name, true);

    xobj.onreadystatechange = function()
    {
        if (xobj.readyState == 4 && xobj.status == "200")
        {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
    return '{}';
}