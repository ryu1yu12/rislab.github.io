//====================================
// 周遊バス折返し判定
//====================================

let lastTerminalTime = {};

const LOOP_ROUTE = [
    "河口湖周遊バス",
    "西湖周遊バス",
    "鳴沢・精進湖・本栖湖周遊バス",
    "ふじっ湖号(左回り)",
    "ふじっ湖号(右回り)"
];

// 河口湖駅の停留所番号
const TERMINAL_BUSSTOP = 25;
//===============================
// 軌跡レイヤ
//===============================

let pastLine = null;
let futureLine = null;


//===============================
// 路線表示
//===============================

async function showTrajectory(bus){

    if(pastLine){

        map.removeLayer(pastLine);

    }

    if(futureLine){

        map.removeLayer(futureLine);

    }

    const response = await fetch(

        "php/get-route.php?workNo=" + bus.workNo

    );

    const route = await response.json();

    drawTrajectory(route);

}

//===============================
// 描画
//===============================

function drawTrajectory(route){

    //--------------------------------
    // 前回の軌跡を消す
    //--------------------------------

    if(pastLine){
        map.removeLayer(pastLine);
        pastLine = null;
    }

    if(futureLine){
        map.removeLayer(futureLine);
        futureLine = null;
    }

    //--------------------------------

    if(!route.connectors){
        return;
    }

    let split = -1;

    route.connectors.forEach((p,i)=>{

        if(p.arrived){
            split = i;
        }

    });

    const past = [];
    const future = [];

    route.connectors.forEach((p,i)=>{

        const pt = [
            Number(p.latitude),
            Number(p.longitude)
        ];

        if(i <= split){
            past.push(pt);
        }

        if(i >= split){
            future.push(pt);
        }

    });

    //--------------------------------
    // 過去（薄青）
    //--------------------------------

    pastLine = L.polyline(past,{
        color:"#8FD3FF",
        weight:6,
        opacity:0.6
    }).addTo(map);

    //--------------------------------
    // 未来（濃青）
    //--------------------------------

    futureLine = L.polyline(future,{
        color:"#0055FF",
        weight:7,
        opacity:1
    }).addTo(map);

    //--------------------------------
    // 周遊バス折返し判定
    //--------------------------------

    checkLoopTerminal(route);

}
//====================================
// 河口湖駅着発判定
//====================================

function checkLoopTerminal(route){

    // 周遊バス以外は終了
    const isLoop = LOOP_ROUTE.some(name =>
        route.routeName &&
        route.routeName.indexOf(name) !== -1
    );

    if(!isLoop){
        return;
    }

    // 到着済みの最後の停留所
    let lastBusStop = null;

    for(const p of route.connectors){

        if(p.arrived && p.busstop != 0){

            lastBusStop = p.busstop;

        }

    }

    // 河口湖駅以外
    if(lastBusStop != TERMINAL_BUSSTOP){
        return;
    }

    const key = route.workNo;

    const now = Date.now();

    // 初回だけ記録
    if(!lastTerminalTime[key]){

        lastTerminalTime[key] = now;

        return;

    }

    const diff = (now-lastTerminalTime[key])/1000;

    // 30秒以上経過して再び河口湖駅なら折返し
    if(diff > 30){

        console.log("折返し検知",route.workNo);

        // 運用履歴を区切る
        if(typeof splitCurrentOperation==="function"){

            splitCurrentOperation(route);

        }

        lastTerminalTime[key]=now;

    }

}