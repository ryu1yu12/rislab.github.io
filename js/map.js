//====================================
// 地図初期化
//====================================

const map = L.map("map", {
    zoomControl: true
});
//====================================
// 地図クリックで解除
//====================================

map.on("click", function(){

    clearInfoPanel();

});
// 山梨県中心
map.setView([35.6639, 138.5683], 12);

// OpenStreetMap
L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


//====================================
// レイヤー
//====================================

// バス
const busLayer = L.layerGroup().addTo(map);

// バス停
const busStopLayer = L.layerGroup().addTo(map);


//====================================
// マーカー管理
//====================================

// バスマーカー
const busMarkers = {};

// バス停マーカー
const stopMarkers = {};


//====================================
// 現在地へ移動
//====================================

function moveToCurrentLocation(){

    if(!navigator.geolocation){

        alert("位置情報が利用できません。");

        return;

    }

    navigator.geolocation.getCurrentPosition(

        function(position){

            map.setView(
                [
                    position.coords.latitude,
                    position.coords.longitude
                ],
                15
            );

        },

        function(){

            alert("現在地を取得できません。");

        }

    );

}