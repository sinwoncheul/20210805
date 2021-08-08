const secretkey = require('./secretkey').secretKey;
const jwt       = require('jsonwebtoken');

// mongodb연동 설정
const mongoclient = require('mongodb').MongoClient;
const ObjectId    = require('mongodb').ObjectId;
// 아이디:암호@서버주소:포트번호/DB명
const mongourl    = "mongodb://id319:pw319@1.234.5.158:37017/id319";

const auth = {
    // 함수 : async function(req, res, next) {  
    // 함수 : async (req, res, next) => {  
    checkToken : async (req, res, next) => {
        // req.body   <= post, put, delete
        // req.query  <= get
        const token = req.headers.token;
        // console.log('auth.js');
        // console.log(req.body);

        if(!token) {
            return res.send({ret:-1, data:'token이 없습니다.'});
        }

        try {
            // token decode하기 (idx, )
            const user  = jwt.verify( token, secretkey );

            if(typeof(user.idx) === 'undefined') {
                return res.send({ret:-1, data:'토큰 invalid'});
            }

            //db에서 정보를 읽어서 token과 비교해서 성공
            const dbconn     = await mongoclient.connect(mongourl);
            const collection = dbconn.db("id319").collection("member7");

            const query = {_id : user.idx }
            const result = await collection.findOne(query,{projection :{ token:1} });
            console.log(result);
            if(result.token.token !== token){
                return res.send({ret:-1, data:'토큰 invalid'});
            }


            
            // 다음으로 넘길때 전달할 값을 req에 보관후 전달함.
            req.idx = user.idx;
            next();
        }
        catch(error){
            console.log(error);
            if(error.message === 'jwt expired'){
                return res.send({ret:-1, data:'토큰 expired'});
            }
            else if(error.message === 'invalid token'){
                return res.send({ret:-1, data:'토큰 invalid'});
            }
            else{
                return res.send({ret:-1, data:'토큰 invalid'});
            }
        }
    },

    testToken : async(req, res, next) => {
        next();
    }
}

module.exports = auth; // 다른곳에서 사용 하기 위해서
