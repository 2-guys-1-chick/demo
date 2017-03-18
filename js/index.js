var icons_path = "http://maps.google.com/mapfiles/kml/pal4/";
var icons = ["icon62.png", "icon31.png", "icon15.png"];
var init_geo = {lat: 50.082736, lng: 14.422212};
var road = [];


loadJSON("roads/road1.json", function (data) {
    road = data;
});

var car_list = {
    car_1: {
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
    }
};

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

    var i = 0;

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
    }, 100);

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
        console.log(car_list);
        if(!car_list.hasOwnProperty(msg.vehicle_uuid))
        {
            car_list[msg.vehicle_uuid] = {};
            car_list[msg.vehicle_uuid].marker = new google.maps.Marker({
                position: msg.vehicle_data.geo,
                map: map,
                icon: "http://maps.google.com/mapfiles/kml/pal4/icon62.png"
            });
        }

        map.setCenter(msg.vehicle_data.geo);

        for(var i in msg)
        {
            car_list[msg.vehicle_uuid][i] = msg[i];
        }

        setMarkerData(car_list[msg.vehicle_uuid].marker, {
            icon: 0,
            geo: car_list[msg.vehicle_uuid].vehicle_data.geo
        });

        renderData("left", msg);
        renderGauge(msg.vehicle_data.speed !== 0 ? parseFloat(parseInt(msg.vehicle_data.speed) + Math.random()*1.3) : 0);
    };

    function renderData(id, data)
    {
        document.getElementById(id).innerHTML = "" +
            //"<b>Speed: </b>" + parseFloat(parseInt(data.vehicle_data.speed) + "." + parseInt(Math.random()*100)) + "Km/h" +
            "";
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