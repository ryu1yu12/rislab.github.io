<?php

date_default_timezone_set("Asia/Tokyo");

header(
    "Content-Type: application/json; charset=UTF-8"
);

$file =
    __DIR__ . "/../data/daytype.json";


//====================================
// POST 保存
//====================================

if($_SERVER["REQUEST_METHOD"] === "POST"){

    $input =
        json_decode(
            file_get_contents("php://input"),
            true
        );

    if(
        !$input ||
        !isset($input["date"]) ||
        !isset($input["type"])
    ){

        echo json_encode([
            "status" => "error",
            "message" => "date/type required"
        ], JSON_UNESCAPED_UNICODE);

        exit;

    }


    $date =
        $input["date"];

    $type =
        $input["type"];


    //--------------------------------
    // 種別チェック
    //--------------------------------

    if(
        $type !== "weekday" &&
        $type !== "holiday" &&
        $type !== "auto"
    ){

        echo json_encode([
            "status" => "error",
            "message" => "type error"
        ], JSON_UNESCAPED_UNICODE);

        exit;

    }
    //====================================
    // 自動判定に戻す
    //====================================

    if($type === "auto"){

        unset(
            $settings[$date]
        );

    }
    else{

        $settings[$date] =
            $type;

    }


    //--------------------------------
    // 現在の設定を読む
    //--------------------------------

    $settings = [];

    if(file_exists($file)){

        $json =
            file_get_contents($file);

        $settings =
            json_decode(
                $json,
                true
            );

        if(!is_array($settings)){

            $settings = [];

        }

    }


    //--------------------------------
    // 保存
    //--------------------------------

    $settings[$date] =
        $type;


    //--------------------------------
    // dataフォルダ確認
    //--------------------------------

    $dir =
        dirname($file);

    if(!is_dir($dir)){

        mkdir(
            $dir,
            0777,
            true
        );

    }


    //--------------------------------
    // 書き込み
    //--------------------------------

    file_put_contents(

        $file,

        json_encode(
            $settings,
            JSON_UNESCAPED_UNICODE |
            JSON_PRETTY_PRINT
        )

    );


    echo json_encode([
        "status" => "ok",
        "date" => $date,
        "type" => $type
    ], JSON_UNESCAPED_UNICODE);

    exit;

}


//====================================
// GET
//====================================

$settings = [];

if(file_exists($file)){

    $json =
        file_get_contents($file);

    $settings =
        json_decode(
            $json,
            true
        );

    if(!is_array($settings)){

        $settings = [];

    }

}


echo json_encode([
    "status" => "ok",
    "settings" => $settings
], JSON_UNESCAPED_UNICODE);

?>