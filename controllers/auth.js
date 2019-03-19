const mysqlDb = require('../services/mysql');
const smsc = require('../services/smsc');
const helper = require('../services/helper');
const userModel = require('../models/user');
const bcrypt = require('bcrypt');
const randtoken = require('rand-token');


const data = {

    register: (req, res) => {
        //Добавляем пароль и сохраняем в базе
        const email = req.body.email;
        const name = req.body.name;

                mysqlDb.query('INSERT INTO users (email, name) VALUES (?,?)', [email, name], (err, resQuery) => {

                    if (err && err.code === 'ER_DUP_ENTRY') {
                        res.json({success: false, error: 'Вы уже зарегистрированы!'});
                        return;
                    }
                    if (err) {
                        console.log(err);
                        return res.json({success: false, error: 'Па каким-то причинам регистрация не удалась'});
                    }
                    else {
                        res.json({success: true, user: name});
                    }
                    // userModel.getUserById(resQuery.insertId, (user, callback)=>{
                    //     if (err) {
                    //         return res.json({success: false, error: 'Па каким-то причинам регистрация не удалась'});
                    //     }
                    //     res.json({success: true, user: user});
                    // })
                });

    },
};

module.exports = data;