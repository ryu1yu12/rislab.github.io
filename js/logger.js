//====================================
// 運行ログ保存
//====================================

async function saveBusLog(buses){

    try{

        const response = await fetch("php/save-log.php",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                datetime:new Date().toISOString(),

                buses:buses

            })

        });

        const result = await response.json();

        if(result.status!="ok"){

            console.error("ログ保存失敗",result);

        }

    }
    catch(error){

        console.error("ログ保存エラー");

        console.error(error);

    }

}