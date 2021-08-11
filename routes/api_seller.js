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

// 파일에서 이미지 읽어서 전송
const fs = require('fs');
const path = require('path');



/*
// 물품번호를 자동으로 증가시키는 시퀀스 생성
db.seq_item7.insert({
    _id : 'SEQ_ITEM7_NO',
    seq : 1
});
*/

// 서버이미지 추가하기
// http://127.0.0.1:3000/api_seller/image1?code=물품코드
router.post('/image1', upload.array("image"), async function(req, res, next) {
    try {
        // 1. 전달되는 값
        const code = req.query.code;

        // upload.single   => req.file    =>  {        }
        // upload.array    => req.files   =>  [{ },{ },{ }]
        var obj = [];
        for(let i=0;i<req.files.length;i++) {
            // 직접 구현... (code물품코드, 이미지명, 이미지타입, 이미지dt)
            obj.push({
                code:code,  
                filename : req.files[i].originalname,
                filetype : req.files[i].mimetype,
                filedata : req.files[i].buffer,
            });
        }

        // 2. db연결
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("itemimg7");

        // 3. db에 추가  [{},{},{}]
        const result = await collection.insertMany( obj );
        if(result.insertedCount === req.files.length){
            return res.send({ret:1, data:'이미지를 추가했습니다.'})
        }
        res.send({ret:0, data:'이미지를 추가실패.'})
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});        
    }
});

// 메인이미지 변경하기
// http://127.0.0.1:3000/api_seller/imageupdate?code=물품코드
router.put('/imageupdate', upload.single("image"), async function(req, res, next) {
    try {
        if( typeof(req.file) !== 'undefined' ){
            // 1. 전달값 받기
            const code = Number(req.query.code);

            // 2. dB연결
            const dbconn   = await mongoclient.connect(mongourl);
            var collection = dbconn.db("id319").collection("item7");

            console.log(req.file);

            // 3. 조건 및 변경
            const query = {_id : code};
            const changeData = {$set : {
                    filename : req.file.originalname,
                    filetype : req.file.mimetype, 
                    filedata : req.file.buffer, 
                } 
            }
            const result = await collection.updateOne(query, changeData);
            console.log(result);
            if( result.matchedCount === 1){
                return res.send({ret:1, data:'이미지 변경했습니다.'});
            }
            res.send({ret:0, data:'이미지 변경 실패 했습니다.'});
        }
        else{
            res.send({ret:0, data:'이미지가 첨부되지 않았습니다.'});
        }
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});        
    }
});

// 서버이미지 표시
// http://127.0.0.1:3000/api_seller/image2?code=90&idx=
router.get('/image2', async function(req, res, next) {
    try{
        const idx = Number(req.query.idx);
        
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("itemimg7");
        // 3. 조회 조건
        const query = { code :req.query.code };
        const result = await collection.find(query,
            {projection:{ filedata:1, filetype:1 }}).toArray();

        if(typeof(result[idx] ) !== 'undefined' ){   
            res.contentType(result[idx].filetype);
            res.send(result[idx].filedata.buffer);
        }
        else { // DB에 이미지가 없을경우
            const tmp = path.join(__dirname + './../image/default.jpg');
            let data = fs.readFileSync(tmp);
            res.contentType("image/jpeg");
            res.send(data);
        }
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 물품1개 정보 전달
// http://127.0.0.1:3000/api_seller/selectone?code=물품코드
router.get('/selectone', async function(req, res, next) {
    try {
        // 1. 전달값 받기
        const code = req.query.code;

        // 2. DB연동
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("item7");

        // 3. 조회
        const query  = { _id : Number(code)};
        const result = await collection.findOne(query);

        // 4. 반환값 리턴
        res.send({ret:1, data:result});
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});        
    }
});


// 메인이미지 표시하기
// http://127.0.0.1:3000/api_seller/image?code=물품코드
router.get('/image', async function(req, res, next) {
    try {
        // 1. 전달값 받기
        const code = Number(req.query.code);
        console.log(code);

        // 2. dB연결
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("item7");

        // 3. 조회 조건
        const query = { _id : code };
        const result = await collection.findOne(query,
            {projection:{ filedata:1, filetype:1 }});
        
        // 4. 이미지로 전송
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});



// 물품목록 (물품명으로 검색, 페이지네이션)
// http://127.0.0.1:3000/api_seller/select?page=1&name=
router.get('/select', async function(req, res, next) {
    try {
        // 1. 전달값 받기
        const page = Number(req.query.page);
        const name = req.query.name;

        // 2. db연결
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("item7");

        // 3. 검색을 포함해서 검색
        const query = { name :  new RegExp(name, 'i')};

        // query의 조건으로 검색, 필요없는 컬럼 3개는 제외
        // 물품명을 기준으로 오름차순 정렬, page에 따라 제외시키고
        // 10개 가져오기 find로 했기 때문에 마지막에 toArray()로 변환
        const rows  = await collection.find(query, 
            { projection : { filedata:0, filename:0, filetype:0 } })
            .sort({_id : -1})
            .skip((page-1)*10)
            .limit(10)
            .toArray();
            
        // 4. 결과반환
        res.send({ret:1, data:rows, count:100});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});


// 일괄수정 [물품코드(변경X, 조건비교), 물품명, 물품내용, 가격, 수량]
// http://127.0.0.1:3000/api_seller/update
router.put('/update', async function(req, res, next) {
    try {
        console.log(req.body);

        // 1. DB연결
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("item7");

        var cnt = 0;
        if( Array.isArray(req.body.code) ) {  // 2개 이상일 경우
            for(let i=0; i<req.body.code.length; i++) {
                const query = {_id : Number(req.body.code[i])};
                const changeData = {$set : {
                    name        : req.body.name[i],
                    text        : req.body.text[i],
                    price       : Number(req.body.price[i]),
                    quantity    : Number(req.body.quantity[i]),
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
                text        : req.body.content,
                price       : Number(req.body.price),
                quantity    : Number(req.body.quantity),
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

        // 삭제할 code값 받기
        const code = req.body.code;  // {code:[2,1,3]}

        // 한개일경우의 조건
        let query = { _id : {$in :[ Number(code) ]} };

        // 2개 이상
        if( Array.isArray(req.body.code) ) { 
            const numArray = code.map(Number); //문자열배열 -> 숫자배열로
            query = { _id : {$in : numArray } };
        }

        const result = await collection.deleteMany(query);
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


// 일괄추가
// http://127.0.0.1:3000/api_seller/insert
router.post('/insert', upload.array("image"), async function(req, res, next) {
    try {
        console.log(req.body);
        console.log(req.files);  //이부분

        // 0. 물품코드 가져오기
        const dbconn   = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id319").collection("seq_item7");

        var arr = [];
        if( Array.isArray(req.body.name) ) { // 2개 이상
            for(let i=0;i<req.body.name.length; i++) {
                const result   = await collection.findOneAndUpdate(
                    {_id:'SEQ_ITEM7_NO'}, { $inc : {seq : 1} });
                arr.push({ 
                    _id         : result.value.seq,
                    name        : req.body.name[i],
                    text        : req.body.text[i],
                    price       : Number(req.body.price[i]),
                    quantity    : Number(req.body.quantity[i]),
                    filename    : req.files[i].originalname,
                    filetype    : req.files[i].mimetype,
                    filedata    : req.files[i].buffer
                });
            }
        }
        else { // 1 개만
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

        if(result.insertedCount === req.body.name.length){
            return res.send({ret:1, 
                data:`${req.body.name.length}개 추가했습니다.`});
        }
        res.send({ret:0, data:'추가실패 했습니다.'});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

module.exports = router;
