山梨地域バスロケーション（リアルタイム専用版）
================================================

この版はPHP・ログ保存・運用履歴・次便予測・運行日区分・バス停API取得を外し、
BusKita APIから取得した現在のバス位置だけを地図に表示します。
30秒ごとに更新します。

含まれる主なファイル:
- index.html
- js/app.js
- css/style.css
- data/vehicle.csv
- img/*

重要：この版はブラウザーから https://api.buskita.com/get-buses に直接POSTします。
API側がCORSを許可していない場合、ブラウザーのセキュリティ制限で取得できません。
その場合、PHPを使わないという条件のままでは、API提供元のCORS対応か、利用許可された別の公開API/プロキシが必要です。
CORSエラーが出ても、PHPファイルを戻すのではなく、まずブラウザー開発者ツールのConsole/Networkで確認してください。

テスト:
1. ZIPを展開
2. GitHub Pagesへアップロードするか、ローカルの静的Webサーバーでindex.htmlを開く
3. 車両数と更新時刻を確認
4. 取得失敗の場合、F12 → ConsoleでCORS/Failed to fetchを確認

ログCSV、PHP、collector.phpはこのZIPには含まれていません。
