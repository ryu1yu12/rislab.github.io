<?php

date_default_timezone_set("Asia/Tokyo");
header("Content-Type: application/json; charset=UTF-8");

//-------------------------
// POSTデータ
//-------------------------

$workNo = $_GET["workNo"] ?? "";

if($workNo==""){

    echo json_encode([
        "status"=>"error",
        "message"=>"workNoなし"
    ]);

    exit;

}

$postData=[

    "workNo"=>(int)$workNo,

    "date"=>date("Y-n-j")

];

//-------------------------
// BusKita API
//-------------------------

$ch=curl_init("https://api.buskita.com/get-map-route-points");

curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);

curl_setopt($ch,CURLOPT_POST,true);

curl_setopt($ch,CURLOPT_HTTPHEADER,[

    "Content-Type: application/json"

]);

curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($postData));

$result=curl_exec($ch);

curl_close($ch);

echo $result;