//====================================
// 車両マスタ
//====================================

// uid → 車両情報
const vehicleMap = {};

//====================================
// vehicle.csv 読み込み
//====================================

async function loadVehicleMaster(){

    try{

        const response = await fetch("data/vehicle.csv?v=" + Date.now());

        const text = await response.text();

        const lines = text.trim().split("\n");

        // ヘッダーを除く
        lines.shift();

        lines.forEach(line=>{

            const cols = line.split(",");

            if(cols.length < 9) return;

            vehicleMap[cols[0]] = {

                uid: cols[0],

                fleetNo: cols[1],     // C

                plateNo: cols[2],     // 1234

                office: cols[3],

                company: cols[4],

                icon: cols[5],

                enabled: cols[6] === "1",

                carType: cols[7],

                model: cols[8]

            };

        });

        console.log("車両マスタ読込完了");

        console.log(vehicleMap);

    }
    catch(error){

        console.error("vehicle.csv 読込失敗");

        console.error(error);

    }

}

//====================================
// UIDから車両情報取得
//====================================

function getVehicle(uid){

    return vehicleMap[uid] || null;

}

//====================================
// 未登録UID判定
//====================================

function isRegistered(uid){

    return uid in vehicleMap;

}