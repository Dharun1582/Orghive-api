const mysql = require('mysql2/promise');

const pool=mysql.createPool({
    host:'localhost',
    database:'orghive',
    user:'root',
    password:'{123456}'
})

module.exports=pool;