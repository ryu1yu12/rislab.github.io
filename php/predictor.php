<?php

date_default_timezone_set("Asia/Tokyo");
header("Content-Type: application/json; charset=UTF-8");

//======================================
// パラメータ
//======================================

$uid = $_GET["uid"] ?? "";
$currentRoute = $_GET["route"] ?? "";

if($uid == ""){

    echo json_encode([
        "status"=>"error",
        "message"=>"uidがありません"
    ]);
    exit;

}

//======================================
// operationログ取得
//======================================

$files = glob("../log/operation_*.csv");

sort($files);

$history = [];

foreach($files as $file){

    $fp = fopen($file,"r");

    if(!$fp){
        continue;
    }

    // ヘッダ
    fgetcsv($fp);

    while(($row = fgetcsv($fp)) !== false){

        if(count($row) < 4){
            continue;
        }

        if($row[1] != $uid){
            continue;
        }

        $history[] = [

            "datetime"=>$row[0],

            "workNo"=>$row[2],

            "route"=>$row[3],

            "delay"=>$row[4] ?? 0

        ];

    }

    fclose($fp);

}

//======================================
// データなし
//======================================

if(count($history)==0){

    echo json_encode([

        "status"=>"error",

        "message"=>"履歴がありません"

    ]);

    exit;

}

//======================================
// 路線遷移学習
//======================================

$transition = [];

for($i=0;$i<count($history)-1;$i++){

    $from = $history[$i]["route"];

    $to = $history[$i+1]["route"];

    $departure = date(

        "H:i",

        strtotime($history[$i+1]["datetime"])

    );

    $key = $from."|||".$to;

    if(!isset($transition[$key])){

        $transition[$key]=[

            "count"=>0,

            "times"=>[]

        ];

    }

    $transition[$key]["count"]++;

    $transition[$key]["times"][]=$departure;

}

//======================================
// 候補抽出
//======================================

$candidate=[];

$total=0;

foreach($transition as $key=>$value){

    list($from,$to)=explode("|||",$key);

    if($currentRoute!=""){

        if($from!=$currentRoute){

            continue;

        }

    }

    $candidate[]=[

        "route"=>$to,

        "count"=>$value["count"],

        "times"=>$value["times"]

    ];

    $total += $value["count"];

}

//======================================
// 候補なし
//======================================

if(count($candidate)==0){

    echo json_encode([

        "status"=>"error",

        "message"=>"予測できません"

    ]);

    exit;

}

//======================================
// 発車時刻中央値
//======================================

$result=[];

foreach($candidate as $c){

    sort($c["times"]);

    $middle = $c["times"][

        floor(count($c["times"])/2)

    ];

    $result[]=[

        "route"=>$c["route"],

        "departure"=>$middle,

        "probability"=>round(

            $c["count"]/$total*100,

            1

        ),

        "count"=>$c["count"]

    ];

}

//======================================
// 確率順
//======================================

usort($result,function($a,$b){

    return $b["probability"] <=> $a["probability"];

});

//======================================
// 出力
//======================================

echo json_encode([

    "status"=>"ok",

    "uid"=>$uid,

    "currentRoute"=>$currentRoute,

    "prediction"=>$result,

    "historyCount"=>count($history)

],JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);