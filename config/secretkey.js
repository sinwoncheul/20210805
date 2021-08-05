// npm i mynodule --save

module.exports = {
    secretKey : '14314defas41v525', //salt값
    option : {
        algorithm : "hs256",   // hash 알고리즘
        expiresIn : "10h",     // 발행된 토큰의 유효시간(10시간)
        issuer    : 'corp01',  // 발행자
    }
}