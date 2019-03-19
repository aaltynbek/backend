var mysql = require('mysql');

const mysqlDb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'',
    database: 'epam'
});

module.exports = mysqlDb;