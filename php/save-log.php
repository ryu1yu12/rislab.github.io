<?php

date_default_timezone_set("Asia/Tokyo");

header(
    "Content-Type: application/json; charset=UTF-8"
);


//======================================
// JSON受信
//======================================

$raw =
    file_get_contents(
        "php://input"
    );


$data =
    json_decode(
        $raw,
        true
    );


if(
    !$data ||
    !isset($data["buses"]) ||
    !is_array($data["buses"])
){

    echo json_encode([
        "status" =>
            "error",

        "message" =>
            "データなし"
    ], JSON_UNESCAPED_UNICODE);

    exit;

}


$buses =
    $data["buses"];


//======================================
// 保存先
//======================================

$logDir =
    __DIR__ . "/../log";


if(
    !is_dir($logDir)
){

    mkdir(
        $logDir,
        0777,
        true
    );

}


//======================================
// ログファイル
//======================================

$date =
    date("Y-m-d");


$file =
    $logDir .
    "/" .
    $date .
    ".csv";


//======================================
// ファイルオープン
//======================================

$newFile =
    !file_exists($file);


$fp =
    fopen(
        $file,
        "a"
    );


if($fp === false){

    echo json_encode([
        "status" =>
            "error",

        "message" =>
            "ログファイルを開けません"
    ], JSON_UNESCAPED_UNICODE);

    exit;

}


//======================================
// ヘッダー
//======================================

if($newFile){

    fputcsv(
        $fp,
        [

            "datetime",

            "uid",

            "workNo",

            "company",

            "route",

            "delay",

            "latitude",

            "longitude",

            "startBusStopNo",

            "endBusStopNo"

        ]
    );

}


//======================================
// 取得時刻
//======================================

$datetime =
    date(
        "Y-m-d H:i:s"
    );


//======================================
// 保存
//======================================

$count = 0;


foreach($buses as $bus){

    //----------------------------------
    // UID
    //----------------------------------

    $uid =
        $bus["device_uid"]
        ?? "";


    if($uid === ""){

        continue;

    }


    //----------------------------------
    // workNo
    //----------------------------------

    $workNo =
        $bus["workNo"]
        ?? "";


    //----------------------------------
    // company
    //----------------------------------

    $company =
        $bus["companyNo"]
        ?? "";


    //----------------------------------
    // 路線
    //----------------------------------

    $route = "";


    if(
        isset($bus["routeNames"]) &&
        is_array($bus["routeNames"])
    ){

        //----------------------------------
        // 1番を優先
        //----------------------------------

        if(
            isset(
                $bus["routeNames"]["1"]
            ) &&
            $bus["routeNames"]["1"] !== null &&
            $bus["routeNames"]["1"] !== ""
        ){

            $route =
                $bus["routeNames"]["1"];

        }
        else{

            //----------------------------------
            // その他の路線名
            //----------------------------------

            foreach(
                $bus["routeNames"]
                as $routeName
            ){

                if(
                    $routeName !== null &&
                    $routeName !== ""
                ){

                    $route =
                        $routeName;

                    break;

                }

            }

        }

    }


    //----------------------------------
    // 遅れ
    //----------------------------------

    $delay =
        $bus["delayMinutes"]
        ?? 0;


    //----------------------------------
    // 位置
    //----------------------------------

    $latitude =
        $bus["position"]["latitude"]
        ?? "";


    $longitude =
        $bus["position"]["longitude"]
        ?? "";


    //----------------------------------
    // バス停番号
    //----------------------------------

    $startBusStopNo =
        $bus["startBusStopNo"]
        ?? "";


    $endBusStopNo =
        $bus["endBusStopNo"]
        ?? "";


    //----------------------------------
    // CSV
    //----------------------------------

    fputcsv(
        $fp,
        [

            $datetime,

            $uid,

            $workNo,

            $company,

            $route,

            $delay,

            $latitude,

            $longitude,

            $startBusStopNo,

            $endBusStopNo

        ]
    );


    $count++;

}


fclose($fp);


//======================================
// 完了
//======================================

echo json_encode(

    [

        "status" =>
            "ok",

        "count" =>
            $count,

        "datetime" =>
            $datetime

    ],

    JSON_UNESCAPED_UNICODE

);

?>