const mysql = require('mysql2/promise');

const pool=mysql.createPool({
    host:'localhost',
    database:'orghive',
    user:'root',
    password:'Batman@7'
})

module.exports=pool;