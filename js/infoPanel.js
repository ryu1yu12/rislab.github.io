//====================================
// 車両情報表示
//====================================

function showInfoPanel(bus, vehicle){

    //--------------------------------
    // 車両情報
    //--------------------------------

    document.getElementById("infoFleetNo").textContent =
        vehicle ? vehicle.fleetNo : "未登録";

    document.getElementById("infoPlateNo").textContent =
        vehicle ? vehicle.plateNo : "-";

    document.getElementById("infoOffice").textContent =
        vehicle ? vehicle.office : "-";

    document.getElementById("infoCompany").textContent =
        vehicle
            ? vehicle.company
            : bus.companyNo;

    document.getElementById("infoCarType").textContent =
        vehicle ? vehicle.carType : "-";

    document.getElementById("infoModel").textContent =
        vehicle ? vehicle.model : "-";


    //--------------------------------
    // 路線
    //--------------------------------

    const route =
        bus.routeNames &&
        bus.routeNames["1"]
            ? bus.routeNames["1"]
            : "-";


    document.getElementById("infoRoute").textContent =
        route;


    //--------------------------------
    // 遅れ
    //--------------------------------

    document.getElementById("infoDelay").textContent =
        formatDelay(
            bus.delayMinutes
        );


    //--------------------------------
    // 現在運用
    //--------------------------------

    document.getElementById("currentOperation").innerHTML =
        route;


    //--------------------------------
    // UID確認
    //--------------------------------

    const uid =
        bus.device_uid ||
        bus.uid ||
        "";


    console.log(
        "================================"
    );

    console.log(
        "情報パネル"
    );

    console.log(
        "UID =",
        uid
    );

    console.log(
        "workNo =",
        bus.workNo
    );

    console.log(
        "route =",
        route
    );

    console.log(
        "================================"
    );


    //--------------------------------
    // UIDがない場合
    //--------------------------------

    if(!uid){

        document.getElementById(
            "todayOperation"
        ).innerHTML =
            "UIDなし";

        document.getElementById(
            "nextOperation"
        ).innerHTML =
            "予測できません";

        return;

    }


    //--------------------------------
    // 今日の運用履歴
    //--------------------------------

    loadOperation(
        uid
    );

}


//====================================
// 今日の運用履歴取得
//====================================

async function loadOperation(uid){

    console.log(
        "loadOperation()",
        uid
    );


    const area =
        document.getElementById(
            "todayOperation"
        );


    area.innerHTML =
        "取得中...";


    try{

        //--------------------------------
        // PHPから運用履歴取得
        //--------------------------------

        const response =
            await fetch(
                "php/operation.php?uid=" +
                encodeURIComponent(uid)
            );


        console.log(
            "operation.php status =",
            response.status
        );


        if(!response.ok){

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "operation.php result =",
            result
        );


        //--------------------------------
        // データなし
        //--------------------------------

        if(
            result.status !== "ok"
        ){

            area.innerHTML =
                "データなし";


            document.getElementById(
                "nextOperation"
            ).innerHTML =
                "予測できません";


            return;

        }


        //--------------------------------
        // 履歴なし
        //--------------------------------

        if(
            !result.history ||
            result.history.length === 0
        ){

            area.innerHTML =
                "運用履歴なし";


            document.getElementById(
                "nextOperation"
            ).innerHTML =
                "予測できません";


            return;

        }


        //--------------------------------
        // 今日の運用履歴
        //--------------------------------

        let html = "";


        result.history.forEach(
            item=>{

                //--------------------------------
                // 時刻
                //--------------------------------

                let start =
                    item.start
                        ? item.start.substring(
                            11,
                            16
                        )
                        : "";


                //--------------------------------
                // 路線
                //--------------------------------

                let route =
                    item.route ||
                    "路線不明";


                html +=
                    start +
                    " ～ " +
                    route +
                    "<br>";

            }
        );


        area.innerHTML =
            html;


        console.log(
            "運用履歴:",
            result.history
        );


        //--------------------------------
        // 次便予測
        //--------------------------------
        //
        // PHP側から返された予測だけを使用。
        //
        // ここでpredictNext()を呼ばない。
        //================================

        const nextArea =
            document.getElementById(
                "nextOperation"
            );


        if(
            result.next &&
            result.next.route
        ){

            let nextHtml = "";


            nextHtml +=
                result.next.route;


            //--------------------------------
            // 一致率
            //--------------------------------

            if(
                result.next.confidence !==
                undefined
            ){

                nextHtml +=
                    "<br>一致率 " +
                    result.next.confidence +
                    "%";

            }
            else if(
                result.next.matchRate !==
                undefined
            ){

                nextHtml +=
                    "<br>一致率 " +
                    result.next.matchRate +
                    "%";

            }


            //--------------------------------
            // 学習回数
            //--------------------------------

            if(
                result.next.count !==
                undefined
            ){

                nextHtml +=
                    "<br>学習回数：" +
                    result.next.count +
                    "回";

            }


            nextArea.innerHTML =
                nextHtml;

        }
        else{

            //--------------------------------
            // PHP側で予測できない
            //--------------------------------

            nextArea.innerHTML =
                "予測できません";

        }

    }
    catch(error){

        console.error(
            "運用履歴取得エラー:",
            error
        );


        area.innerHTML =
            "取得失敗";


        document.getElementById(
            "nextOperation"
        ).innerHTML =
            "予測できません";

    }

}


//====================================
// 情報パネルをクリア
//====================================

function clearInfoPanel(){

    document.getElementById(
        "infoFleetNo"
    ).textContent =
        "-";

    document.getElementById(
        "infoPlateNo"
    ).textContent =
        "-";

    document.getElementById(
        "infoOffice"
    ).textContent =
        "-";

    document.getElementById(
        "infoCompany"
    ).textContent =
        "-";

    document.getElementById(
        "infoCarType"
    ).textContent =
        "-";

    document.getElementById(
        "infoModel"
    ).textContent =
        "-";

    document.getElementById(
        "infoRoute"
    ).textContent =
        "-";

    document.getElementById(
        "infoDelay"
    ).textContent =
        "-";


    document.getElementById(
        "currentOperation"
    ).innerHTML =
        "-";

    document.getElementById(
        "todayOperation"
    ).innerHTML =
        "-";

    document.getElementById(
        "nextOperation"
    ).innerHTML =
        "-";


    //--------------------------------
    // 軌跡
    //--------------------------------

    if(pastLine){

        map.removeLayer(
            pastLine
        );

        pastLine = null;

    }


    //--------------------------------
    // 未来ルート
    //--------------------------------

    if(futureLine){

        map.removeLayer(
            futureLine
        );

        futureLine = null;

    }

}