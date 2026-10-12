//====================================
// バス停読込
//====================================

async function loadBusStops(){

    try{

        const response = await fetch("php/get-busstops.php");

        const data = await response.json();

        displayBusStops(data.busstops);

    }
    catch(error){

        console.error("バス停取得失敗");

        console.error(error);

    }

}


//====================================
// バス停表示
//====================================

function displayBusStops(busStops){

    busStopLayer.clearLayers();

    busStops.forEach(stop=>{

        const marker = L.circleMarker(

            [
                Number(stop.position.latitude),
                Number(stop.position.longitude)
            ],

            {
                radius:6,
                color:"blue",
                fillColor:"white",
                fillOpacity:1,
                weight:2
            }

        );

        marker.bindPopup(

            "<b>" + stop.name + "</b><br>" +

            "のりば：" + stop.platformNo

        );

        marker.addTo(busStopLayer);

        stopMarkers[stop.id] = marker;

    });

}