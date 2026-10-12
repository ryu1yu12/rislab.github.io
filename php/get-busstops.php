<?php

header("Content-Type: application/json; charset=UTF-8");

$url = "https://api.buskita.com/get-busstops";

$payload = json_encode([
    "siteId"   => 12,
    "language" => 1,
    "version"  => 35
]);

$ch = curl_init($url);

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
    ]
]);

$result = curl_exec($ch);

if ($result === false) {

    http_response_code(500);

    echo json_encode([
        "error" => curl_error($ch)
    ]);

    curl_close($ch);

    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

http_response_code($httpCode);

echo $result;