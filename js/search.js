//====================================
// 検索
//====================================

document.getElementById("searchButton").addEventListener("click", searchBus);

document.getElementById("searchBox").addEventListener("keydown", function(e){

    if(e.key === "Enter"){

        searchBus();

    }

});


//====================================
// 車両検索
//====================================

function searchBus(){

    const keyword = document
        .getElementById("searchBox")
        .value
        .trim()
        .toUpperCase();

    if(keyword === ""){

        return;

    }

    //----------------------------------
    // vehicle.csv検索
    //----------------------------------

    let uid = null;

    for(const key in vehicleMap){

        const vehicle = vehicleMap[key];

        if(

            vehicle.fleetNo.toUpperCase() === keyword ||

            vehicle.plateNo === keyword

        ){

            uid = key;

            break;

        }

    }

    if(uid == null){

        alert("登録されていない車両です。");

        return;

    }

    //----------------------------------
    // 地図上に存在するか
    //----------------------------------

    const marker = busMarkers[uid];

    if(marker == null){

        alert("現在運行していません。");

        return;

    }

    //----------------------------------
    // ズーム
    //----------------------------------
    marker.openPopup();

    showTrajectory(bus);

    map.setView(marker.getLatLng(),17);


}


//====================================
// 検索解除
//====================================

document.getElementById("clearButton").addEventListener("click", function(){

    document.getElementById("searchBox").value="";

    map.setView([35.6639,138.5683],12);

});