<?php

date_default_timezone_set("Asia/Tokyo");

//====================================
// 設定
//====================================

$apiUrl =
    "https://api.buskita.com/get-buses";

$logDir =
    __DIR__ . "/../log";


//====================================
// ログフォルダ作成
//====================================

if (!is_dir($logDir)) {

    mkdir(
        $logDir,
        0777,
        true
    );

}


//====================================
// API送信
//====================================

$payload = json_encode([
    "siteId" => 12
]);

$ch = curl_init($apiUrl);

curl_setopt_array($ch, [

    CURLOPT_POST => true,

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_POSTFIELDS => $payload,

    CURLOPT_HTTPHEADER => [

        "Content-Type: application/json",

        "Accept: application/json",

        "Origin: https://yamanashi.buskita.com",

        "Referer: https://yamanashi.buskita.com/",

        "User-Agent: Mozilla/5.0"

    ],

    CURLOPT_CONNECTTIMEOUT => 10,

    CURLOPT_TIMEOUT => 30

]);

$response =
    curl_exec($ch);


//====================================
// CURLエラー
//====================================

if ($response === false) {

    echo
        "CURL ERROR: " .
        curl_error($ch) .
        PHP_EOL;

    curl_close($ch);

    exit(1);

}


//====================================
// HTTPコード
//====================================

$httpCode =
    curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

curl_close($ch);


if ($httpCode !== 200) {

    echo
        "HTTP ERROR: " .
        $httpCode .
        PHP_EOL;

    echo
        $response .
        PHP_EOL;

    exit(1);

}


//====================================
// JSON解析
//====================================

$data =
    json_decode(
        $response,
        true
    );


if (
    json_last_error() !==
    JSON_ERROR_NONE
) {

    echo
        "JSON ERROR: " .
        json_last_error_msg() .
        PHP_EOL;

    exit(1);

}


//====================================
// buses確認
//====================================

if (
    !isset($data["buses"]) ||
    !is_array($data["buses"])
) {

    echo
        "busesがありません" .
        PHP_EOL;

    exit(1);

}


$buses =
    $data["buses"];


//====================================
// ログファイル
//====================================

$date =
    date("Y-m-d");

$logFile =
    $logDir .
    "/" .
    $date .
    ".csv";


//====================================
// 新規ファイル判定
//====================================

$isNew =
    !file_exists($logFile);


//====================================
// CSVオープン
//====================================

$fp =
    fopen(
        $logFile,
        "a"
    );


if ($fp === false) {

    echo
        "ログファイルを開けません" .
        PHP_EOL;

    exit(1);

}


//====================================
// ヘッダー
//====================================

if ($isNew) {

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


//====================================
// 取得時刻
//====================================

$datetime =
    date(
        "Y-m-d H:i:s"
    );


//====================================
// 保存件数
//====================================

$count = 0;


//====================================
// バスごとに保存
//====================================

foreach ($buses as $bus) {


    //--------------------------------
    // UID
    //--------------------------------

    $uid =
        $bus["device_uid"]
        ?? "";


    if ($uid === "") {

        continue;

    }


    //--------------------------------
    // workNo
    //--------------------------------

    $workNo =
        $bus["workNo"]
        ?? "";


    //--------------------------------
    // company
    //--------------------------------

    $company =
        $bus["companyNo"]
        ?? "";


    //--------------------------------
    // 位置
    //--------------------------------

    $latitude =
        $bus["position"]["latitude"]
        ?? "";

    $longitude =
        $bus["position"]["longitude"]
        ?? "";


    //--------------------------------
    // 遅れ
    //--------------------------------

    $delay =
        $bus["delayMinutes"]
        ?? 0;


    //--------------------------------
// 路線名
//--------------------------------

$route = "";

if (
    isset($bus["routeNames"]) &&
    is_array($bus["routeNames"])
) {

    // まず日本語路線名1を優先
    if (
        isset($bus["routeNames"]["1"]) &&
        $bus["routeNames"]["1"] !== null &&
        $bus["routeNames"]["1"] !== ""
    ) {

        $route =
            $bus["routeNames"]["1"];

    }
    else {

        // 1がなければ最初に存在するもの
        foreach (
            $bus["routeNames"] as $routeName
        ) {

            if (
                $routeName !== null &&
                $routeName !== ""
            ) {

                $route =
                    $routeName;

                break;

            }

        }

    }

}

    //--------------------------------
    // バス停番号
    //--------------------------------

    $startBusStopNo =
        $bus["startBusStopNo"]
        ?? "";

    $endBusStopNo =
        $bus["endBusStopNo"]
        ?? "";


    //--------------------------------
    // CSV保存
    //--------------------------------

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


//====================================
// 終了
//====================================

fclose($fp);


echo
    $datetime .
    " : " .
    $count .
    "台保存" .
    PHP_EOL;

?>