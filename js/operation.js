//====================================
// 運用解析
//====================================

let operationMap = {};


//====================================
// 次便予測用
//====================================

let predictionPatterns = [];


//====================================
// 周遊路線設定
//====================================
//
// loopMinutes
//   所定一周時間
//
// marginMinutes
//   判定余裕
//
// startDelay
//   その周回開始時点の遅れ
//
// 判定:
//   所定時間
//   + 開始時点の遅れ
//   + 判定余裕
//
// を超えたら次周とみなす
//====================================

const LOOP_SETTINGS = {

    "河口湖周遊": {

        loopMinutes: 54,

        marginMinutes: 5

    },

    "西湖周遊": {

        loopMinutes: 95,

        marginMinutes: 5

    },

    "鳴沢": {

        loopMinutes: 130,

        marginMinutes: 5

    },

    "精進湖": {

        loopMinutes: 130,

        marginMinutes: 5

    },

    "本栖湖": {

        loopMinutes: 130,

        marginMinutes: 5

    },

    "ふじっ湖号(左回り)": {

        loopMinutes: 72,

        marginMinutes: 5

    },

    "ふじっ湖号(右回り)": {

        loopMinutes: 72,

        marginMinutes: 5

    }

};


//====================================
// 平日 / 土休日
//====================================

function getDayType(datetime){

    const d =
        new Date(datetime);


    if(
        isNaN(d.getTime())
    ){

        return "weekday";

    }


    //--------------------------------
    // YYYY-MM-DD
    //--------------------------------

    const yyyy =
        d.getFullYear();

    const mm =
        String(
            d.getMonth() + 1
        ).padStart(2,"0");

    const dd =
        String(
            d.getDate()
        ).padStart(2,"0");


    const date =
        yyyy +
        "-" +
        mm +
        "-" +
        dd;


    //--------------------------------
    // カレンダー指定を優先
    //--------------------------------

    if(
        typeof dayTypeSettings !==
        "undefined" &&
        dayTypeSettings[date]
    ){

        return dayTypeSettings[date];

    }


    //--------------------------------
    // 指定なし → 通常の曜日判定
    //--------------------------------

    const day =
        d.getDay();


    if(
        day === 0 ||
        day === 6
    ){

        return "holiday";

    }


    return "weekday";

}

//====================================
// 日付取得
//====================================

function getDateString(datetime){

    const d =
        datetime instanceof Date
            ? datetime
            : new Date(datetime);

    if(isNaN(d.getTime())){

        return "";

    }

    const yyyy =
        d.getFullYear();

    const mm =
        String(
            d.getMonth() + 1
        ).padStart(2,"0");

    const dd =
        String(
            d.getDate()
        ).padStart(2,"0");

    return (
        yyyy +
        "-" +
        mm +
        "-" +
        dd
    );

}


//====================================
// 時刻差（分）
//====================================

function diffMinutes(
    start,
    end
){

    const a =
        new Date(start).getTime();

    const b =
        new Date(end).getTime();

    if(
        isNaN(a) ||
        isNaN(b)
    ){

        return 0;

    }

    return (
        b - a
    ) / 60000;

}


//====================================
// ログ読込
//====================================

async function loadOperationAnalysis(){

    try{

        const response =
            await fetch(
                "php/get-log.php"
            );

        if(!response.ok){

            throw new Error(
                "HTTP " +
                response.status
            );

        }

        const data =
            await response.json();

        if(
            data.status !== "ok"
        ){

            console.log(
                "ログなし"
            );

            return;

        }

        analyzeOperation(
            data.logs || []
        );

    }
    catch(error){

        console.error(
            "運用ログ読込エラー:",
            error
        );

    }

}


//====================================
// ログ解析
//====================================

function analyzeOperation(logs){

    operationMap = {};

    //--------------------------------
    // 元データを壊さない
    //--------------------------------

    const sortedLogs =
        [...logs];

    //--------------------------------
    // 日時順
    //--------------------------------

    sortedLogs.sort(
        (a,b)=>
            new Date(a.datetime) -
            new Date(b.datetime)
    );


    //--------------------------------
    // UIDごと
    //--------------------------------

    sortedLogs.forEach(log=>{

        if(!log){

            return;

        }

        if(!log.uid){

            return;

        }

        if(!operationMap[log.uid]){

            operationMap[log.uid] = [];

        }

        operationMap[log.uid].push(
            log
        );

    });


    //--------------------------------
    // 運用生成
    //--------------------------------

    createOperationTable();

}


//====================================
// 周遊設定取得
//====================================

function getLoopSetting(route){

    if(!route){

        return null;

    }

    const text =
        String(route);

    const names =
        Object.keys(
            LOOP_SETTINGS
        );

    for(
        const name of names
    ){

        if(
            text.includes(name)
        ){

            return LOOP_SETTINGS[name];

        }

    }

    return null;

}


//====================================
// 周遊路線判定
//====================================

function isLoopBusRoute(route){

    return (
        getLoopSetting(route) !== null
    );

}


//====================================
// 河口湖駅25判定
//====================================

function isKawaguchikoStation25(log){

    if(!log){

        return false;

    }

    const start =
        Number(
            log.startBusStopNo
        );

    const end =
        Number(
            log.endBusStopNo
        );

    return (
        start === 25 ||
        end === 25
    );

}


//====================================
// 河口湖駅25「到着」判定
//====================================
//
// 25を含むログになっただけでは
// 到着/出発を完全には判定できないため、
// 位置ログの変化と組み合わせる。
//
// 現在のAPIでは
//
// startBusStopNo
// endBusStopNo
//
// のどちらかが25なら
// 河口湖駅関連ログとして扱う。
//====================================

function passedKawaguchikoStation(
    previousLog,
    currentLog
){

    if(
        !previousLog ||
        !currentLog
    ){

        return false;

    }

    const previous25 =
        isKawaguchikoStation25(
            previousLog
        );

    const current25 =
        isKawaguchikoStation25(
            currentLog
        );


    //--------------------------------
    // 25ではない
    // ↓
    // 25になった
    //--------------------------------

    if(
        !previous25 &&
        current25
    ){

        return true;

    }


    return false;

}


//====================================
// 周回時間超過判定
//====================================

function isLoopTimeExceeded(
    current,
    checkTime
){

    if(!current){

        return false;

    }

    const setting =
        getLoopSetting(
            current.route
        );

    if(!setting){

        return false;

    }


    //--------------------------------
    // 周回開始
    //--------------------------------

    const startTime =
        new Date(
            current.start
        ).getTime();

    if(isNaN(startTime)){

        return false;

    }


    //--------------------------------
    // 開始時点の遅れ
    //--------------------------------

    const startDelay =
        Number(
            current.startDelay
        ) || 0;


    //--------------------------------
    // 判定時間
    //--------------------------------

    const limitMinutes =
        setting.loopMinutes +
        startDelay +
        setting.marginMinutes;


    const limitTime =
        startTime +
        limitMinutes *
        60 *
        1000;


    //--------------------------------
    // 判定対象時刻
    //--------------------------------

    const targetTime =
        checkTime
            ? new Date(
                checkTime
              ).getTime()
            : new Date(
                current.end
              ).getTime();


    if(isNaN(targetTime)){

        return false;

    }


    return (
        targetTime >=
        limitTime
    );

}


//====================================
// 同一workNoでも別便になるか
//====================================
//
// 通常路線では、同じworkNoが続く限り
// 基本的に同一運用。
//
// ただしログが長時間途切れた場合は
// 別便の可能性がある。
//
// 現在は30分以上空いた場合のみ
// 別運用候補とする。
//
// 周遊路線については別処理。
//====================================

function isSameWorkGapTooLong(
    current,
    log
){

    if(!current || !log){

        return false;

    }

    const gap =
        diffMinutes(
            current.end,
            log.datetime
        );

    if(gap <= 0){

        return false;

    }

    return gap >= 30;

}


//====================================
// 運用オブジェクト作成
//====================================

function createOperationFromLog(
    log
){

    return {

        workNo:
            log.workNo,

        route:
            log.route || "",

        start:
            log.datetime,

        end:
            log.datetime,

        delay:
            log.delay,

        startDelay:
            Number(
                log.delay
            ) || 0,

        dayType:
            getDayType(
                log.datetime
            ),

        loopCount: 1

    };

}


//====================================
// 運用生成
//====================================

function createOperationTable(){

    const result = {};


    Object.keys(
        operationMap
    ).forEach(uid=>{

        const logs =
            operationMap[uid];


        result[uid] = [];


        let current = null;

        let previousLog = null;


        logs.forEach(log=>{

            //--------------------------------
            // 初回
            //--------------------------------

            if(current === null){

                current =
                    createOperationFromLog(
                        log
                    );

                previousLog =
                    log;

                return;

            }


            //--------------------------------
            // workNo変更
            //--------------------------------

            let operationChanged =
                String(
                    log.workNo
                ) !==
                String(
                    current.workNo
                );


            //--------------------------------
            // 同一workNoの長時間空白
            //--------------------------------

            if(
                !operationChanged &&
                !isLoopBusRoute(
                    current.route
                )
            ){

                if(
                    isSameWorkGapTooLong(
                        current,
                        log
                    )
                ){

                    operationChanged =
                        true;

                }

            }


            //--------------------------------
            // 周遊路線
            //--------------------------------

            if(
                !operationChanged &&
                isLoopBusRoute(
                    current.route
                )
            ){

                //--------------------------------
                // 河口湖駅25
                //--------------------------------

                if(
                    passedKawaguchikoStation(
                        previousLog,
                        log
                    )
                ){

                    operationChanged =
                        true;

                    console.log(
                        "周遊：駅25検知",
                        uid,
                        current.route
                    );

                }


                //--------------------------------
                // 時間超過
                //--------------------------------

                else{

                    const checkCurrent = {

                        ...current,

                        end:
                            log.datetime

                    };


                    if(
                        isLoopTimeExceeded(
                            checkCurrent,
                            log.datetime
                        )
                    ){

                        operationChanged =
                            true;

                        console.log(
                            "周遊：時間超過",
                            uid,
                            current.route,
                            "開始:",
                            current.start,
                            "判定:",
                            log.datetime
                        );

                    }

                }

            }


            //--------------------------------
            // 新しい運用
            //--------------------------------

            if(operationChanged){

                result[uid].push(
                    current
                );


                current =
                    createOperationFromLog(
                        log
                    );

            }


            //--------------------------------
            // 同一運用
            //--------------------------------

            else{

                current.end =
                    log.datetime;

                if(
                    log.route
                ){

                    current.route =
                        log.route;

                }

                if(
                    log.delay !==
                    undefined
                ){

                    current.delay =
                        log.delay;

                }

            }


            previousLog =
                log;

        });


        //--------------------------------
        // 最後
        //--------------------------------

        if(current){

            result[uid].push(
                current
            );

        }

    });


    //--------------------------------
    // 保存
    //--------------------------------

    operationMap =
        result;


    console.log(
        "=============================="
    );

    console.log(
        "運用生成結果",
        result
    );

    console.log(
        "=============================="
    );


    //--------------------------------
    // 次便学習
    //--------------------------------

    createPredictionTable(
        result
    );

}


//====================================
// 日付ごとの運用を取得
//====================================

function groupOperationsByDate(
    operations
){

    const dayMap = {};


    operations.forEach(op=>{

        if(!op || !op.start){

            return;

        }

        const date =
            getDateString(
                op.start
            );

        if(!date){

            return;

        }

        if(!dayMap[date]){

            dayMap[date] = [];

        }

        dayMap[date].push(
            op
        );

    });


    return dayMap;

}


//====================================
// 運用を学習用キーにする
//====================================

function operationKey(op){

    if(!op){

        return "";

    }

    return String(
        op.workNo
    );

}


//====================================
// 次便パターン学習
//====================================
//
// 平日と土休日を分離。
// UIDは学習時には限定しない。
//
// 同じworkNoの運用を複数台が担当しても
// パターンとして学習できる。
//====================================

function createPredictionTable(
    result
){

    predictionPatterns = [];


    Object.keys(
        result
    ).forEach(uid=>{

        const operations =
            result[uid];


        if(
            !operations ||
            operations.length < 2
        ){

            return;

        }


        const dayMap =
            groupOperationsByDate(
                operations
            );


        Object.keys(
            dayMap
        ).forEach(date=>{

            const ops =
                dayMap[date];


            if(
                ops.length < 2
            ){

                return;

            }


            ops.sort(
                (a,b)=>
                    new Date(a.start) -
                    new Date(b.start)
            );


            const dayType =
                getDayType(
                    ops[0].start
                );


            const sequence =
                ops.map(
                    op =>
                        operationKey(op)
                );


            predictionPatterns.push({

                uid:
                    uid,

                date:
                    date,

                dayType:
                    dayType,

                sequence:
                    sequence,

                operations:
                    ops

            });

        });

    });


    console.log(
        "=============================="
    );

    console.log(
        "次便学習パターン"
    );

    console.log(
        "パターン数:",
        predictionPatterns.length
    );


    predictionPatterns.forEach(
        (pattern,index)=>{

            console.log(
                "学習[" +
                index +
                "]",
                pattern.date,
                pattern.dayType,
                pattern.sequence
            );

        }
    );


    console.log(
        "=============================="
    );

}


//====================================
// 今日の運用取得
//====================================

function getTodayOperations(
    uid
){

    if(!uid){

        return [];

    }


    const operations =
        operationMap[uid];


    if(!operations){

        return [];

    }


    const today =
        getDateString(
            new Date()
        );


    return operations
        .filter(
            op =>
                op.start &&
                getDateString(
                    op.start
                ) === today
        )
        .sort(
            (a,b)=>
                new Date(a.start) -
                new Date(b.start)
        );

}


//====================================
// 今日現在までの運用列
//====================================

function getCurrentSequence(
    uid
){

    const operations =
        getTodayOperations(
            uid
        );


    if(
        operations.length === 0
    ){

        return [];

    }


    return operations.map(
        op =>
            String(
                op.workNo
            )
    );

}


//====================================
// 今日何便目か
//====================================

function getCurrentOperationNumber(
    uid
){

    const operations =
        getTodayOperations(
            uid
        );


    return operations.length;

}


//====================================
// 今日の現在運用
//====================================

function getCurrentOperation(
    uid
){

    const operations =
        getTodayOperations(
            uid
        );


    if(
        operations.length === 0
    ){

        return null;

    }


    return operations[
        operations.length - 1
    ];

}


//====================================
// 過去パターン検索
//====================================
//
// 「朝から2便」が一致するものを検索。
// 平日/土休日は分離。
//
// 重要:
// 2件以上一致する場合だけ
// 学習済みとして扱う。
//====================================

function findMatchingPatterns(
    uid,
    currentSequence
){

    if(
        !currentSequence ||
        currentSequence.length < 2
    ){

        return [];

    }


    const today =
        getCurrentOperation(
            uid
        );


    if(!today){

        return [];

    }


    const dayType =
        getDayType(
            today.start
        );


    const baseSequence =
        currentSequence.slice(
            0,
            2
        );


    const matches =
        predictionPatterns.filter(
            pattern=>{

                //--------------------------------
                // 平日 / 土休日
                //--------------------------------

                if(
                    pattern.dayType !==
                    dayType
                ){

                    return false;

                }


                //--------------------------------
                // 2便未満は除外
                //--------------------------------

                if(
                    pattern.sequence.length <
                    2
                ){

                    return false;

                }


                //--------------------------------
                // 朝2便一致
                //--------------------------------

                return (

                    String(
                        pattern.sequence[0]
                    ) ===
                    String(
                        baseSequence[0]
                    )

                    &&

                    String(
                        pattern.sequence[1]
                    ) ===
                    String(
                        baseSequence[1]
                    )

                );

            }
        );


    return matches;

}


//====================================
// 次便予測
//====================================

function predictNext(
    uid
){

    if(!uid){

        return null;

    }


    //--------------------------------
    // 今日の運用
    //--------------------------------

    const operations =
        getTodayOperations(
            uid
        );


    //--------------------------------
    // 2便目まで必要
    //--------------------------------

    if(
        operations.length < 2
    ){

        console.log(
            "次便予測：まだ2便目になっていません",
            uid,
            "現在便数:",
            operations.length
        );

        return null;

    }


    //--------------------------------
    // 現在sequence
    //--------------------------------

    const currentSequence =
        operations.map(
            op =>
                String(
                    op.workNo
                )
        );


    //--------------------------------
    // 過去パターン
    //--------------------------------

    const matches =
        findMatchingPatterns(
            uid,
            currentSequence
        );


    //--------------------------------
    // 2便一致なし
    //--------------------------------

    if(
        matches.length === 0
    ){

        console.log(
            "次便予測：一致パターンなし",
            uid,
            currentSequence
        );

        return null;

    }


    //--------------------------------
    // 2件以上一致したか
    //--------------------------------

    if(
        matches.length < 2
    ){

        console.log(
            "次便予測：学習データ不足",
            uid,
            "一致:",
            matches.length
        );

        return null;

    }


    //--------------------------------
    // 現在まで一致する
    // 最長位置を調べる
    //--------------------------------

    let matchedLength = 0;


    matches.forEach(
        pattern=>{

            const max =
                Math.min(
                    currentSequence.length,
                    pattern.sequence.length
                );


            let length = 0;


            for(
                let i = 0;
                i < max;
                i++
            ){

                if(
                    String(
                        currentSequence[i]
                    ) ===
                    String(
                        pattern.sequence[i]
                    )
                ){

                    length++;

                }
                else{

                    break;

                }

            }


            if(
                length >
                matchedLength
            ){

                matchedLength =
                    length;

            }

        }
    );


    //--------------------------------
    // 次便候補
    //--------------------------------

    const currentIndex =
        currentSequence.length - 1;


    const candidates = [];


    matches.forEach(
        pattern=>{

            //--------------------------------
            // 現在まで存在しない
            //--------------------------------

            if(
                pattern.sequence.length <=
                currentIndex + 1
            ){

                return;

            }


            //--------------------------------
            // 現在まで完全一致
            //--------------------------------

            let same = true;


            for(
                let i = 0;
                i <= currentIndex;
                i++
            ){

                if(
                    String(
                        pattern.sequence[i]
                    ) !==
                    String(
                        currentSequence[i]
                    )
                ){

                    same = false;

                    break;

                }

            }


            if(!same){

                return;

            }


            //--------------------------------
            // 次便
            //--------------------------------

            const nextIndex =
                currentIndex + 1;


            const nextWorkNo =
                pattern.sequence[
                    nextIndex
                ];


            const operation =
                pattern.operations[
                    nextIndex
                ];


            if(!operation){

                return;

            }


            //--------------------------------
            // 候補
            //--------------------------------

            let candidate =
                candidates.find(
                    item =>
                        String(
                            item.workNo
                        ) ===
                        String(
                            nextWorkNo
                        )
                );


            if(!candidate){

                candidate = {

                    workNo:
                        nextWorkNo,

                    route:
                        operation.route,

                    time:
                        operation.start,

                    count:
                        0

                };


                candidates.push(
                    candidate
                );

            }


            candidate.count++;

        }
    );


    //--------------------------------
    // 候補なし
    //--------------------------------

    if(
        candidates.length === 0
    ){

        console.log(
            "次便予測：候補なし",
            uid,
            currentSequence
        );

        return null;

    }


    //--------------------------------
    // 候補を回数順
    //--------------------------------

    candidates.sort(
        (a,b)=>
            b.count -
            a.count
    );


    const best =
        candidates[0];


    //--------------------------------
    // 一致率
    //--------------------------------

    const total =
        candidates.reduce(
            (sum,item)=>
                sum +
                item.count,
            0
        );


    best.matchRate =
        total > 0
            ? Math.round(
                (
                    best.count /
                    total
                ) *
                100
            )
            : 0;


    best.totalCount =
        total;


    best.matchedLength =
        matchedLength;


    best.patternCount =
        matches.length;


    //--------------------------------
    // 予測結果
    //--------------------------------

    console.log(
        "=============================="
    );

    console.log(
        "次便予測"
    );

    console.log(
        "UID:",
        uid
    );

    console.log(
        "現在便数:",
        operations.length
    );

    console.log(
        "現在sequence:",
        currentSequence
    );

    console.log(
        "一致パターン:",
        matches.length
    );

    console.log(
        "一致便数:",
        matchedLength
    );

    console.log(
        "予測workNo:",
        best.workNo
    );

    console.log(
        "予測route:",
        best.route
    );

    console.log(
        "一致率:",
        best.matchRate + "%"
    );

    console.log(
        "=============================="
    );


    return best;

}


//====================================
// 次便予測取得
//====================================

function getNextOperationPrediction(
    uid
){

    const prediction =
        predictNext(
            uid
        );


    if(!prediction){

        return {

            status:
                "unknown",

            message:
                "予測できません",

            matchRate:
                0

        };

    }


    return {

        status:
            "ok",

        workNo:
            prediction.workNo,

        route:
            prediction.route,

        time:
            prediction.time,

        matchRate:
            prediction.matchRate,

        matchedLength:
            prediction.matchedLength,

        count:
            prediction.count,

        patternCount:
            prediction.patternCount

    };

}


//====================================
// 周遊バスの現在周回数
//====================================
//
// operationMap上で既に分割された運用について
// 同一UID・同一路線の当日運用を数える。
//
// ※workNoが変わらない周遊でも
// 時間超過または25検知で分割される。
//====================================

function getLoopCountToday(
    uid,
    route
){

    const operations =
        getTodayOperations(
            uid
        );


    if(
        !route ||
        operations.length === 0
    ){

        return 0;

    }


    let count = 0;


    operations.forEach(
        op=>{

            if(
                isLoopBusRoute(
                    op.route
                ) &&
                String(
                    op.route
                ).includes(
                    String(route)
                )
            ){

                count++;

            }

        }
    );


    return count;

}


//====================================
// 現在便情報
//====================================

function getCurrentOperationInfo(
    uid
){

    const operations =
        getTodayOperations(
            uid
        );


    if(
        operations.length === 0
    ){

        return {

            operationNumber:
                0,

            current:
                null

        };

    }


    const current =
        operations[
            operations.length - 1
        ];


    return {

        operationNumber:
            operations.length,

        current:
            current

    };

}


//====================================
// 周遊バス折返し
//====================================

function splitCurrentOperation(
    route
){

    console.log(
        "新しい周回:",
        route
    );

}