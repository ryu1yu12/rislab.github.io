<?php

date_default_timezone_set("Asia/Tokyo");

header(
    "Content-Type: application/json; charset=UTF-8"
);


//==================================================
// UID
//==================================================

$uid = $_GET["uid"] ?? "";

if($uid === ""){

    echo json_encode([
        "status" => "error",
        "message" => "uid required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


//==================================================
// ログディレクトリ
//==================================================

$logDir = "../log";


//==================================================
// 今日のログ
//==================================================

$todayFile =
    $logDir .
    "/" .
    date("Y-m-d") .
    ".csv";


if(!file_exists($todayFile)){

    echo json_encode([
        "status" => "error",
        "message" => "log not found"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


//==================================================
// CSV読み込み関数
//==================================================

function readCsv($file){

    $logs = [];

    if(!file_exists($file)){

        return $logs;

    }


    $fp = fopen($file, "r");

    if(!$fp){

        return $logs;

    }


    // ヘッダ
    fgetcsv($fp);


    while(($row = fgetcsv($fp)) !== false){

        if(count($row) < 8){

            continue;

        }


        $logs[] = [

            "time" =>
                $row[0],

            "uid" =>
                $row[1],

            "workNo" =>
                $row[2],

            "company" =>
                $row[3],

            "route" =>
                $row[4],

            "delay" =>
                $row[5],

            "lat" =>
                $row[6],

            "lng" =>
                $row[7]

        ];

    }


    fclose($fp);


    return $logs;

}


//==================================================
// 今日のログ
//==================================================

$todayLogs =
    readCsv($todayFile);


//==================================================
// 対象UIDだけ
//==================================================

$historyLogs = [];


foreach($todayLogs as $log){

    if(
        (string)$log["uid"] ===
        (string)$uid
    ){

        $historyLogs[] =
            $log;

    }

}


//==================================================
// 時刻順
//==================================================

usort(
    $historyLogs,
    function($a,$b){

        return
            strtotime($a["time"]) -
            strtotime($b["time"]);

    }
);


//==================================================
// 周遊路線設定
//==================================================

$LOOP_SETTINGS = [

    "河口湖周遊" => [

        "minutes" => 54,
        "margin" => 5

    ],

    "西湖周遊" => [

        "minutes" => 95,
        "margin" => 5

    ],

    "鳴沢" => [

        "minutes" => 130,
        "margin" => 5

    ],

    "精進湖" => [

        "minutes" => 130,
        "margin" => 5

    ],

    "本栖湖" => [

        "minutes" => 130,
        "margin" => 5

    ],

    "ふじっ湖号(左回り)" => [

        "minutes" => 72,
        "margin" => 5

    ],

    "ふじっ湖号(右回り)" => [

        "minutes" => 72,
        "margin" => 5

    ]

];


//==================================================
// 周遊設定取得
//==================================================

function getLoopSetting(
    $route,
    $settings
){

    if(!$route){

        return null;

    }


    foreach($settings as $name => $setting){

        if(
            mb_strpos(
                $route,
                $name
            ) !== false
        ){

            return $setting;

        }

    }


    return null;

}


//==================================================
// 河口湖駅25判定
//==================================================

function isStation25($log){

    if(!$log){

        return false;

    }


    /*
     * 現在のCSVには
     *
     * startBusStopNo
     * endBusStopNo
     *
     * が保存されていない場合がある。
     *
     * その場合はfalse。
     */

    if(
        !isset($log["startBusStopNo"]) &&
        !isset($log["endBusStopNo"])
    ){

        return false;

    }


    $start =
        isset($log["startBusStopNo"])
            ? intval($log["startBusStopNo"])
            : 0;

    $end =
        isset($log["endBusStopNo"])
            ? intval($log["endBusStopNo"])
            : 0;


    return (
        $start === 25 ||
        $end === 25
    );

}


//==================================================
// 周遊時間超過
//==================================================

function loopTimeExceeded(
    $operation,
    $currentLog,
    $settings
){

    $setting =
        getLoopSetting(
            $operation["route"],
            $settings
        );


    if(!$setting){

        return false;

    }


    $startTime =
        strtotime(
            $operation["start"]
        );


    $currentTime =
        strtotime(
            $currentLog["time"]
        );


    if(
        $startTime === false ||
        $currentTime === false
    ){

        return false;

    }


    //----------------------------------------------
    // 周回開始時の遅れ
    //----------------------------------------------

    $startDelay =
        intval(
            $operation["startDelay"] ?? 0
        );


    //----------------------------------------------
    // 所定時間
    // ＋開始時遅れ
    // ＋5分
    //----------------------------------------------

    $limit =
        $setting["minutes"] +
        $startDelay +
        $setting["margin"];


    return (
        $currentTime >=
        $startTime +
        ($limit * 60)
    );

}


//==================================================
// 今日の運用生成
//==================================================

$operations = [];

$current = null;

$previousLog = null;


foreach($historyLogs as $log){

    //----------------------------------------------
    // 最初
    //----------------------------------------------

    if($current === null){

        $current = [

            "start" =>
                $log["time"],

            "end" =>
                $log["time"],

            "route" =>
                $log["route"],

            "workNo" =>
                $log["workNo"],

            "delay" =>
                $log["delay"],

            "startDelay" =>
                intval(
                    $log["delay"]
                )

        ];


        $previousLog =
            $log;

        continue;

    }


    //----------------------------------------------
    // workNo変更
    //----------------------------------------------

    $changed = false;


    if(
        (string)$log["workNo"] !==
        (string)$current["workNo"]
    ){

        $changed = true;

    }


    //----------------------------------------------
    // 路線変更
    //----------------------------------------------

    if(
        !$changed &&
        $log["route"] !==
        $current["route"]
    ){

        $changed = true;

    }


    //----------------------------------------------
    // 周遊バス
    //----------------------------------------------

    if(
        !$changed &&
        getLoopSetting(
            $current["route"],
            $LOOP_SETTINGS
        ) !== null
    ){

        //------------------------------------------
        // 河口湖駅25を検知
        //------------------------------------------

        $previous25 =
            isStation25(
                $previousLog
            );

        $current25 =
            isStation25(
                $log
            );


        if(
            $current25 &&
            !$previous25
        ){

            $changed = true;

        }


        //------------------------------------------
        // 25を取り逃した場合
        //------------------------------------------

        if(
            !$changed &&
            loopTimeExceeded(
                $current,
                $log,
                $LOOP_SETTINGS
            )
        ){

            $changed = true;

        }

    }


    //----------------------------------------------
    // 30分以上空いた
    //----------------------------------------------

    if(!$changed){

        $previousTime =
            strtotime(
                $previousLog["time"]
            );

        $currentTime =
            strtotime(
                $log["time"]
            );


        if(
            $previousTime !== false &&
            $currentTime !== false &&
            ($currentTime - $previousTime) >= 1800
        ){

            $changed = true;

        }

    }


    //----------------------------------------------
    // 新しい運用
    //----------------------------------------------

    if($changed){

        $operations[] =
            $current;


        $current = [

            "start" =>
                $log["time"],

            "end" =>
                $log["time"],

            "route" =>
                $log["route"],

            "workNo" =>
                $log["workNo"],

            "delay" =>
                $log["delay"],

            "startDelay" =>
                intval(
                    $log["delay"]
                )

        ];

    }
    else{

        //------------------------------------------
        // 同じ運用
        //------------------------------------------

        $current["end"] =
            $log["time"];

        $current["delay"] =
            $log["delay"];

    }


    $previousLog =
        $log;

}


//==================================================
// 最後の運用
//==================================================

if($current !== null){

    $operations[] =
        $current;

}


//==================================================
// 運用がない
//==================================================

if(count($operations) === 0){

    echo json_encode([

        "status" =>
            "error",

        "message" =>
            "no history"

    ], JSON_UNESCAPED_UNICODE);

    exit;

}


//==================================================
// 現在運用
//==================================================

$current =
    $operations[
        count($operations) - 1
    ];


//==================================================
// 曜日種別
//==================================================

function getDayType($date){

    $w =
        intval(
            date(
                "w",
                strtotime($date)
            )
        );


    if($w === 0){

        return "holiday";

    }


    if($w === 6){

        return "holiday";

    }


    return "weekday";

}


$todayType =
    getDayType(
        date("Y-m-d")
    );


//==================================================
// 過去ログを日ごとに取得
//==================================================

$dailyOperations = [];


//==================================================
// 全CSV
//==================================================

$files =
    glob(
        $logDir . "/*.csv"
    );


sort($files);


foreach($files as $csv){

    $date =
        basename(
            $csv,
            ".csv"
        );


    if(!preg_match(
        '/^\d{4}-\d{2}-\d{2}$/',
        $date
    )){

        continue;

    }


    //----------------------------------------------
    // 今日を除く
    //----------------------------------------------

    if(
        $date ===
        date("Y-m-d")
    ){

        continue;

    }


    //----------------------------------------------
    // 曜日
    //----------------------------------------------

    if(
        getDayType($date) !==
        $todayType
    ){

        continue;

    }


    //----------------------------------------------
    // ログ
    //----------------------------------------------

    $logs =
        readCsv($csv);


    //----------------------------------------------
    // UIDごと
    //----------------------------------------------

    $uidLogs = [];


    foreach($logs as $log){

        if(
            (string)$log["uid"] !==
            (string)$uid
        ){

            continue;

        }


        $uidLogs[] =
            $log;

    }


    if(count($uidLogs) === 0){

        continue;

    }


    //----------------------------------------------
    // 時刻順
    //----------------------------------------------

    usort(
        $uidLogs,
        function($a,$b){

            return
                strtotime($a["time"]) -
                strtotime($b["time"]);

        }
    );


    //----------------------------------------------
    // 日ごとの運用生成
    //----------------------------------------------

    $dayOps = [];

    $op = null;

    $prev = null;


    foreach($uidLogs as $log){

        if($op === null){

            $op = [

                "start" =>
                    $log["time"],

                "end" =>
                    $log["time"],

                "route" =>
                    $log["route"],

                "workNo" =>
                    $log["workNo"]

            ];


            $prev =
                $log;

            continue;

        }


        $changed = false;


        //------------------------------------------
        // workNo
        //------------------------------------------

        if(
            (string)$log["workNo"] !==
            (string)$op["workNo"]
        ){

            $changed = true;

        }


        //------------------------------------------
        // 路線
        //------------------------------------------

        if(
            !$changed &&
            $log["route"] !==
            $op["route"]
        ){

            $changed = true;

        }


        //------------------------------------------
        // 30分空き
        //------------------------------------------

        if(!$changed){

            $t1 =
                strtotime(
                    $prev["time"]
                );

            $t2 =
                strtotime(
                    $log["time"]
                );


            if(
                $t1 !== false &&
                $t2 !== false &&
                ($t2 - $t1) >= 1800
            ){

                $changed = true;

            }

        }


        if($changed){

            $dayOps[] =
                $op;


            $op = [

                "start" =>
                    $log["time"],

                "end" =>
                    $log["time"],

                "route" =>
                    $log["route"],

                "workNo" =>
                    $log["workNo"]

            ];

        }
        else{

            $op["end"] =
                $log["time"];

        }


        $prev =
            $log;

    }


    if($op !== null){

        $dayOps[] =
            $op;

    }


    if(count($dayOps) >= 3){

        $dailyOperations[] = [

            "date" =>
                $date,

            "dayType" =>
                getDayType($date),

            "operations" =>
                $dayOps

        ];

    }

}


//==================================================
// 次便予測
//
// 朝から2便一致した場合のみ予測
//==================================================

$next = null;

$currentCount =
    count($operations);


//--------------------------------------------------
// 今日2便以上必要
//--------------------------------------------------

if($currentCount >= 2){

    //----------------------------------------------
    // 今日の最初の2便
    //----------------------------------------------

    $todaySequence = [

        (string)$operations[0]["workNo"],

        (string)$operations[1]["workNo"]

    ];


    //----------------------------------------------
    // 過去パターンを検索
    //----------------------------------------------

    $candidates = [];


    foreach(
        $dailyOperations as $day
    ){

        $ops =
            $day["operations"];


        if(count($ops) < 3){

            continue;

        }


        //------------------------------------------
        // 過去の最初の2便
        //------------------------------------------

        if(
            (string)$ops[0]["workNo"] !==
            $todaySequence[0]
        ){

            continue;

        }


        if(
            (string)$ops[1]["workNo"] !==
            $todaySequence[1]
        ){

            continue;

        }


        //------------------------------------------
        // 今日が2便目なら3便目を候補
        //------------------------------------------

        $todayIndex =
            $currentCount - 1;


        if(
            !isset(
                $ops[
                    $todayIndex + 1
                ]
            )
        ){

            continue;

        }


        $candidate =
            $ops[
                $todayIndex + 1
            ];


        $key =
            (string)$candidate["workNo"];


        if(!isset(
            $candidates[$key]
        )){

            $candidates[$key] = [

                "workNo" =>
                    $candidate["workNo"],

                "route" =>
                    $candidate["route"],

                "time" =>
                    $candidate["start"],

                "count" =>
                    0

            ];

        }


        $candidates[$key]["count"]++;

    }


    //----------------------------------------------
    // 最も多い候補
    //----------------------------------------------

    if(count($candidates) > 0){

        usort(
            $candidates,
            function($a,$b){

                return
                    $b["count"] -
                    $a["count"];

            }
        );


        $best =
            $candidates[0];


        $total = 0;


        foreach(
            $candidates as $candidate
        ){

            $total +=
                $candidate["count"];

        }


        $best["confidence"] =
            $total > 0
                ? round(
                    $best["count"] /
                    $total *
                    100,
                    1
                )
                : 0;


        $next =
            $best;

    }

}


//==================================================
// 出力
//==================================================

echo json_encode(

    [

        "status" =>
            "ok",

        "current" =>
            $current,

        "history" =>
            $operations,

        "next" =>
            $next,

        "operationCount" =>
            $currentCount

    ],

    JSON_UNESCAPED_UNICODE |
    JSON_PRETTY_PRINT

);

?>