var mysql = require('mysql');
var util = require('util');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Admotion,100',
    database: 'admotion'
});

pool.query = util.promisify(pool.query); // Magic happens here.
module.exports = pool;