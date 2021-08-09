var express = require('express');
var router = express.Router();

// mongodb연동 설정
const mongoclient = require('mongodb').MongoClient;
const ObjectId    = require('mongodb').ObjectId;
// 아이디:암호@서버주소:포트번호/DB명
const mongourl    = "mongodb://id319:pw319@1.234.5.158:37017/id319";

// 파일첨부 설정 
const multer      = require('multer');
const upload      = multer({storage : multer.memoryStorage()});

// 글번호(자동증가를 위해서) 
// mongodb에 counter7 컬렉션 만들기 입력완료 후 ctrl + enter
// db.counter7.insert({
//     _id : 'SEQ_BOARD7_NO',
//     seq : 1
// });


// 일괄수정 [물품코드(변경X, 조건비교), 물품명, 물품내용, 가격, 수량]
// http://127.0.0.1:3000/api_seller/update
router.put('/update', async function(req, res, next) {
    try {
        // 1. DB연결
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("item7");

        var cnt = 0;
        if( Array.isArray(req.body.code) ) {  // 2개 이상일 경우
            for(let i=0; i<req.body.code.length; i++) {
                const query = {_id : Number(req.body.code[i])};
                const changeData = {$set : {
                    name        : req.body.name[i],
                    text     : req.body.content[i],
                    price       : req.body.price[i],
                    quantity    : req.body.quantity[i],
                }};
                const result = await collection.updateOne(query, changeData);
                cnt  = cnt + result.matchedCount;
            }
            if(cnt === req.body.code.length) {
                return res.send({ret:1, data:'일괄수정했습니다'});
            }
            res.send({ret : 0, data:'일괄수정 실패했습니다.'});
        }
        else{
            const query = {_id : Number(req.body.code)};
            const changeData = {$set : {
                name        : req.body.name,
                text     : req.body.content,
                price       : req.body.price,
                quantity    : req.body.quantity,
            }};
            const result = await collection.updateOne(query, changeData);
            if( result.matchedCount === 1){
                return res.send({ret:1, data:'일괄수정했습니다'});
            }
            res.send({ret : 0, data:'일괄수정 실패했습니다.'});
        }
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});


// 일괄삭제
// http://127.0.0.1:3000/api_seller/delete
router.delete('/delete', async function(req, res, next) {
    try {
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("item7");

        const code = req.body.code;
        let query = { _id : {$in :[ Number(code) ]} };
        if( Array.isArray(req.body.code) ) { // 2개 이상
            const numArray = code.map(Number); //문자열배열 -> 숫자배열로
            query = { _id : {$in : numArray } };
        }

        const result = await collection.deleteMany(query);
        console.log(result);
        if(result.deletedCount > 0 ){
            return res.send({ret:1, data:'일괄삭제 했습니다.'});
        }
        res.send({ret : 0, data:'일괄삭제 실패했습니다.'});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});


// http://127.0.0.1:3000/api_seller/insert
router.post('/insert',  upload.array("image"), async function(req, res, next) {
    try {
        //0. 물품 코드 가져오기
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("seq_item7");
        
        var arr = [];
        if( Array.isArray(req.body.name)) { // 2개 이상
            for(let i=0; i<req.body.name.length; i++){
                const result = await collection.findOneAndUpdate(
                    {_id:'SEQ_ITEM7_NO'}, { $inc : {seq : 1}});
                arr.push({
                    _id         : result.value.seq,
                    name        : req.body.name,
                    text        : req.body.text,
                    price       : Number(req.body.price),
                    quantity    : Number(req.body.quantity),
                    filename    : req.files[i].origianlname,
                    filetype    : req.files[i].mimetype,
                    filedata    : req.files[i].buffer
                });       
            }
      
        }
        else {
            const result   = await collection.findOneAndUpdate(
                {_id:'SEQ_ITEM7_NO'}, { $inc : {seq : 1} });
            arr.push({ 
                _id         : result.value.seq,
                name        : req.body.name,
                text        : req.body.text,
                price       : Number(req.body.price),
                quantity    : Number(req.body.quantity),
                filename    : req.files[0].originalname,
                filetype    : req.files[0].mimetype,
                filedata    : req.files[0].buffer
            });  
        }
            // arr  => [{}]   [{}, {}, {}]
        // 3. insertMany(obj)
        collection = dbconn.db("id319").collection("item7");
        const result = await collection.insertMany(arr);
        console.log(result);
        
        if(result.insertedCount === req.body.name.length) {
            return res.send({ret :1 ,data : `${req.body.name.length}개 추가했습니다.`})
        }
        res.send({ret :0, data : '추가 실패했습니다.'});
    
        
        
     

        //1. 전달값 받기
        // {name : ['a1,a2],}
        console.log(req.body);  // 물품명, 가격, 수량, 물품내용
        console.log(req.files); // 첨부한 파일

        // 2. obj = [{ },{ },{ } .....]
        res.send({ret:1});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

module.exports = router;


