//====================================
// バス描画
//====================================

function drawBus(bus, vehicle){

    // 車両情報（未登録対応）
    const fleetNo = vehicle ? vehicle.fleetNo : "未登録";
    const plateNo = vehicle ? vehicle.plateNo : "----";
    const office  = vehicle ? vehicle.office  : "未登録";
    const iconFile = vehicle ? vehicle.icon : "ymk_lv.png";
    const carType = vehicle ? vehicle.carType : "----";
    const model = vehicle ? vehicle.model : "----";
    // 路線名
    const routeName = bus.routeNames?.["1"] ?? "不明";

    // 遅れ
    const delay = formatDelay(bus.delayMinutes);

    //----------------------------------
    // アイコン
    //----------------------------------

    const html = `
        <div class="bus-icon">
            <img src="img/${iconFile}">
            <div class="bus-number">${fleetNo}</div>
            <div class="bus-delay">${delay}</div>
        </div>
    `;

    const busIcon = L.divIcon({
        html: html,
        className: "",
        iconSize: [60,70],
        iconAnchor: [30,35]
    });

    //----------------------------------
    // マーカー
    //----------------------------------

    const marker = L.marker(
        [
            bus.position.latitude,
            bus.position.longitude
        ],
        {
            icon: busIcon
        }
    );

    //----------------------------------
    // ポップアップ
    //----------------------------------

    marker.bindPopup(`
        <b>${fleetNo}</b><br>
        UID：${bus.device_uid}<br>
        ナンバー：${plateNo}<br>
        営業所：${office}<br>
        遅れ：${delay}<br>
        路線：${routeName}<br>
        車種：${carType}<br>
        年式：${model}
    `);
    marker.on("click", function(){

    showTrajectory(bus);
    showInfoPanel(bus,vehicle);
    });

    marker.addTo(busLayer);

    // 検索用
    busMarkers[bus.device_uid] = marker;

}


//====================================
// 遅れ表示
//====================================

function formatDelay(delay){

    delay = Number(delay);

    if(delay > 0){
        return "+" + delay;
    }

    if(delay < 0){
        return delay;
    }

    return "定刻";

}