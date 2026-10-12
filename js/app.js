//====================================
// 設定
//====================================

const UPDATE_INTERVAL = 300000;

// 一度通知したUID

const unknownList = new Set();


//====================================
// 初期処理
//====================================

window.onload = async function(){

    await loadVehicleMaster();

    await loadBusStops();

    await loadBusData();

    loadOperationAnalysis();

    setInterval(loadBusData, UPDATE_INTERVAL);

};


//====================================
// バス取得
//====================================

async function loadBusData(){

    try{

        const response = await fetch("php/get-buses.php");

        if(!response.ok){

            throw new Error("HTTP " + response.status);

        }

        const data = await response.json();

        console.log(data);

        if(!data.buses){

            console.error("busesが存在しません");

            return;

        }

        displayBuses(data.buses);


        document.getElementById("busCount").textContent =
            "車両数：" + data.buses.length + "台";

        document.getElementById("updateTime").textContent =
            "更新：" + new Date().toLocaleTimeString();

    }


    catch(error){

        console.error(error);

    }

}


//====================================
// バス表示
//====================================

function displayBuses(buses){

    busLayer.clearLayers();

    // 検索用マーカーをリセット
    for(const key in busMarkers){

        delete busMarkers[key];

    }

    const newUnknown = [];

    buses.forEach(bus=>{

        //----------------------------------
        // UID取得
        //----------------------------------

        const uid = bus.device_uid;

        //----------------------------------
        // 車両マスタ検索
        //----------------------------------

        const vehicle = getVehicle(uid);

        //----------------------------------
        // 未登録UID
        //----------------------------------

        if(!vehicle){

    if(!unknownList.has(bus.device_uid)){

        unknownList.add(bus.device_uid);

        if(typeof addUnknownBus === "function"){
        addUnknownBus(bus);
        }   

    }

    }else{

            // 非表示設定
            if(!vehicle.enabled){

                return;

            }

        }

        //----------------------------------
        // 登録済み・未登録どちらも描画
        //----------------------------------

        drawBus(bus, vehicle);

    });

    //----------------------------------
    // 新規未登録UIDをまとめて通知
    //----------------------------------

    if(newUnknown.length){

        alert(
            "未登録UIDを検知しました\n\n" +
            newUnknown.join("\n")
        );

    }

}
