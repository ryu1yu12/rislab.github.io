<?php

header("Content-Type: application/json; charset=UTF-8");

$date = $_GET["date"] ?? date("Y-m-d");

$file = "../log/".$date.".csv";

if(!file_exists($file)){

    echo json_encode([
        "status"=>"error",
        "message"=>"ログがありません"
    ]);

    exit;
}

$fp = fopen($file,"r");

$header = fgetcsv($fp);

$data = [];

while(($row = fgetcsv($fp)) !== false){

    $data[] = array_combine($header,$row);

}

fclose($fp);

echo json_encode([
    "status"=>"ok",
    "logs"=>$data
]);