//====================================
// 運行日区分カレンダー
//====================================

let dayTypeSettings = {};

let calendarYear;
let calendarMonth;


//====================================
// 初期化
//====================================

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        await loadDayTypeSettings();

        const now = new Date();

        calendarYear =
            now.getFullYear();

        calendarMonth =
            now.getMonth();

        createDayTypeCalendar();

    }
);


//====================================
// 設定読み込み
//====================================

async function loadDayTypeSettings(){

    try{

        const response =
            await fetch(
                "php/daytype.php"
            );

        const data =
            await response.json();

        if(data.status === "ok"){

            dayTypeSettings =
                data.settings || {};

        }

    }
    catch(error){

        console.error(
            "運行日区分読込エラー",
            error
        );

    }

}


//====================================
// 日付から自動区分
//====================================

function getAutoDayType(date){

    const d =
        new Date(
            date + "T00:00:00"
        );

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
// 指定日の区分
//====================================

function getSpecifiedDayType(date){

    if(
        dayTypeSettings[date]
    ){

        return dayTypeSettings[date];

    }

    return getAutoDayType(date);

}


//====================================
// カレンダー生成
//====================================

function createDayTypeCalendar(){

    const area =
        document.getElementById(
            "dayTypeCalendar"
        );

    if(!area){

        return;

    }


    const year =
        calendarYear;

    const month =
        calendarMonth;


    //--------------------------------
    // 月初・月末
    //--------------------------------

    const first =
        new Date(
            year,
            month,
            1
        );

    const last =
        new Date(
            year,
            month + 1,
            0
        );


    const firstDay =
        first.getDay();

    const lastDate =
        last.getDate();


    //--------------------------------
    // HTML
    //--------------------------------

    let html = "";


    html +=
        '<div class="calendar-header">';


    html +=
        '<button onclick="changeCalendarMonth(-1)">';

    html += "‹";

    html += "</button>";


    html +=
        '<div class="calendar-title">';

    html +=
        year +
        "年" +
        (month + 1) +
        "月";

    html += "</div>";


    html +=
        '<button onclick="changeCalendarMonth(1)">';

    html += "›";

    html += "</button>";


    html += "</div>";


    //--------------------------------
    // 曜日
    //--------------------------------

    html +=
        '<div class="calendar-week">';

    const weekNames = [
        "日",
        "月",
        "火",
        "水",
        "木",
        "金",
        "土"
    ];


    weekNames.forEach(
        name => {

            html +=
                '<div class="calendar-weekday">' +
                name +
                "</div>";

        }
    );


    html += "</div>";


    //--------------------------------
    // 日付
    //--------------------------------

    html +=
        '<div class="calendar-days">';


    //--------------------------------
    // 空白
    //--------------------------------

    for(
        let i = 0;
        i < firstDay;
        i++
    ){

        html +=
            '<div class="calendar-day empty"></div>';

    }


    //--------------------------------
    // 日付
    //--------------------------------

    for(
        let day = 1;
        day <= lastDate;
        day++
    ){

        const date =
            year +
            "-" +
            String(
                month + 1
            ).padStart(2,"0") +
            "-" +
            String(day)
                .padStart(2,"0");


        const type =
            getSpecifiedDayType(date);


        const manual =
            dayTypeSettings[date];


        let className =
            "calendar-day";


        if(type === "weekday"){

            className +=
                " weekday";

        }
        else{

            className +=
                " holiday";

        }


        if(manual){

            className +=
                " manual";

        }


        //--------------------------------
        // 今日
        //--------------------------------

        const today =
            new Date();

        const todayString =
            today.getFullYear() +
            "-" +
            String(
                today.getMonth()+1
            ).padStart(2,"0") +
            "-" +
            String(
                today.getDate()
            ).padStart(2,"0");


        if(date === todayString){

            className +=
                " today";

        }


        //--------------------------------
        // 明日以降
        //--------------------------------

        const tomorrow =
            new Date();

        tomorrow.setHours(
            0,0,0,0
        );

        tomorrow.setDate(
            tomorrow.getDate()+1
        );


        const target =
            new Date(
                date + "T00:00:00"
            );


        if(target >= tomorrow){

            className +=
                " future";

        }


        html +=
            '<div ' +
            'class="' +
            className +
            '" ' +
            'onclick="selectDayType(\'' +
            date +
            '\')">';


        html +=
            '<span class="calendar-number">' +
            day +
            "</span>";


        html +=
            '<span class="calendar-type">';


        if(type === "weekday"){

            html += "平日";

        }
        else{

            html += "土休";

        }


        html += "</span>";


        html += "</div>";

    }


    html += "</div>";


    //--------------------------------
    // 凡例
    //--------------------------------

    html +=
        '<div class="calendar-legend">';

    html +=
        '<span class="legend-weekday">' +
        "● 平日" +
        "</span>";

    html +=
        '<span class="legend-holiday">' +
        "● 土休日" +
        "</span>";

    html +=
        '<span>' +
        "※手動指定は枠付き" +
        "</span>";

    html += "</div>";


    area.innerHTML =
        html;

}


//====================================
// 月変更
//====================================

function changeCalendarMonth(diff){

    calendarMonth += diff;


    if(calendarMonth < 0){

        calendarMonth = 11;

        calendarYear--;

    }


    if(calendarMonth > 11){

        calendarMonth = 0;

        calendarYear++;

    }


    createDayTypeCalendar();

}


//====================================
// 日付選択
//====================================

function selectDayType(date){

    const type =
        getSpecifiedDayType(date);


    const manual =
        dayTypeSettings[date];


    const message =
        document.getElementById(
            "dayTypeMessage"
        );


    let text =
        date +
        "：";


    if(type === "weekday"){

        text +=
            "平日";

    }
    else{

        text +=
            "土休日";

    }


    if(manual){

        text +=
            "（手動指定）";

    }
    else{

        text +=
            "（自動判定）";

    }


    message.innerHTML =
        text;


    //--------------------------------
    // 操作用ボタン
    //--------------------------------

    const panel =
        document.getElementById(
            "dayTypeButtons"
        );


    panel.innerHTML =

        '<button onclick="setDayType(\'' +
        date +
        '\',\'weekday\')">' +

        "平日にする" +

        "</button>" +


        '<button onclick="setDayType(\'' +
        date +
        '\',\'holiday\')">' +

        "土休日にする" +

        "</button>" +


        '<button onclick="resetDayType(\'' +
        date +
        '\')">' +

        "自動に戻す" +

        "</button>";

}


//====================================
// 区分変更
//====================================

async function setDayType(
    date,
    type
){

    try{

        const response =
            await fetch(
                "php/daytype.php",
                {

                    method:
                        "POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            date:
                                date,

                            type:
                                type

                        })

                }
            );


        const data =
            await response.json();


        if(data.status !== "ok"){

            throw new Error(
                data.message ||
                "保存失敗"
            );

        }


        dayTypeSettings[date] =
            type;


        createDayTypeCalendar();

        selectDayType(date);


    }
    catch(error){

        console.error(error);

        alert(
            "保存に失敗しました"
        );

    }

}


//====================================
// 自動判定に戻す
//====================================

async function resetDayType(date){

    try{

        const response =
            await fetch(
                "php/daytype.php",
                {

                    method:
                        "POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            date:
                                date,

                            type:
                                "auto"

                        })

                }
            );


        const data =
            await response.json();


        if(data.status !== "ok"){

            throw new Error(
                data.message ||
                "保存失敗"
            );

        }


        delete dayTypeSettings[date];


        createDayTypeCalendar();


        document.getElementById(
            "dayTypeMessage"
        ).innerHTML =
            date +
            "：自動判定に戻しました";


        document.getElementById(
            "dayTypeButtons"
        ).innerHTML = "";


    }
    catch(error){

        console.error(error);

        alert(
            "保存に失敗しました"
        );

    }

}