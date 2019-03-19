const mysqlDb = require('../services/mysql');
const randtoken = require('rand-token');
const helper = require('../services/helper');
const moment = require('moment');

const data = {
    getUserByPhone: (phone, callback) => {
        mysqlDb.query('SELECT * FROM users WHERE phone=?', [phone], (err, res) => {
            if (err) {
                callback(false);
            } else {
                const user = res[0] ? res[0] : false;
                if(user.birthday) {
                    user.birthday = moment(user.birthday).format('DD-MM-YYYY');
                }
                callback(user);
            }
        })
    },
    getUserByToken: (token, callback) => {
        mysqlDb.query('SELECT * FROM users WHERE token=?', [token], (err, res) => {
            if (err) {
                callback(false);
                return;
            }
            const user = res[0] ? res[0] : false;
            if(user.birthday) {
                user.birthday = moment(user.birthday).format('DD-MM-YYYY');
            }
            callback(user);
        })
    },
    getUserById: (id, callback) => {
        mysqlDb.query('SELECT * FROM users WHERE id=?', [id], (err, res) => {
            if (err) {
                callback(false);
                return;
            }
            const user = res[0] ? res[0] : false;
            if(user.birthday) {
                user.birthday = moment(user.birthday).format('DD-MM-YYYY');
            }
            callback(user);
        })
    },
    changeToken: (userId, callback) => {
        let token = randtoken.generate(50);
        mysqlDb.query('UPDATE users SET token=? WHERE id=?', [token, userId], (err, res) => {
            if (err) {
                callback(false);
            } else {
                callback(token);
            }
        })
    },
    changeAvatar: (avatar, userId, callback) => {
        mysqlDb.query('UPDATE users SET avatar=? WHERE id=?', [avatar, userId], (err, res) => {
            if (err) {
                callback(false);
            } else {
                callback(res);
            }
        })
    },
    editPartner: (data, userId, callback) => {
        mysqlDb.query('UPDATE users SET name=?, email=?, address=?, site=?, hours=? WHERE id=?', [data.name, data.email, data.address, data.site, data.hours, userId], (err, res) => {
            if (err) {
                callback(false);
            } else {
                callback(res);
            }
        })
    },
    editPartnerDesc: (data, userId, callback) => {
        mysqlDb.query('UPDATE users SET description=? WHERE id=?', [data.desc, userId], (err, res) => {
            if (err) {
                console.log('err', err);
                callback(false);
            } else {
                callback(res);
            }
        })
    },
    editUser: (data, userId, callback) => {
        mysqlDb.query('UPDATE users SET name=?, birthday=?, email=? WHERE id=?', [data.name, data.birthday, data.email, userId], (err, res) => {
            if (err) {
                callback(false);
            } else {
                callback(res);
            }
        })
    },
    balanceDecrementCheck: (userId, amount, callback) => {
        if(!userId || !amount){
            callback({
                check: false,
                message: 'Не заданы все параметры'
            });
        }else{
            data.getUserById(userId, (user)=>{
                if(amount > user.balance){
                    callback({
                        check: false,
                        message: 'Недостаточно средств!'
                    });
                }else{
                    callback({
                        check: true,
                    });
                }
            })
        }
    },
    balanceDecrement: (userId, amount, comment = '', callback) => {
        if (!userId || !amount) {
            callback({
                success: false,
                message: 'Не заданы все параметры'
            });
        } else {
            data.getUserById(userId, (user) => {
                if (amount > user.balance) {
                    callback({
                        success: false,
                        message: 'Недостаточно средств!'
                    });
                } else {
                    let datetime = new Date().toLocaleString();
                    let after_balance = Number(user.balance) - Number(amount);
                    mysqlDb.query('UPDATE users SET balance=? WHERE id=?', [after_balance, userId], (err, res) => {
                        if (err) {
                            return callback(false);
                        }
                        mysqlDb.query('INSERT INTO balance_history (user_id, type, before_amount, after_amount, amount, comment, date) VALUES (?,?,?,?,?,?,?) ', [userId, '-', user.balance, after_balance, amount, comment, datetime], (err, resQuery) => {
                            if (err) {
                                callback(false);
                            } else {
                                callback({
                                    success: true,
                                    insertId: resQuery.insertId,
                                    user
                                });
                            }
                        })
                    })

                }
            })
        }
    },
    balanceIncrement: (userId, amount, payboxId, comment = '', callback) => {
        if (!userId || !amount) {
            callback({
                success: false,
                message: 'Не заданы все параметры'
            });
        } else {
            data.getUserById(userId, (user) => {
                let datetime = new Date().toLocaleString();
                let after_balance = Number(user.balance) + Number(amount);
                mysqlDb.query('UPDATE users SET balance=? WHERE id=?', [after_balance, userId], (err, res) => {
                    if (err) {
                        return callback(false);
                    }
                    mysqlDb.query('INSERT INTO balance_history (user_id, type, before_amount, after_amount, amount, paybox_id, comment, date) VALUES (?,?,?,?,?,?,?,?) ', [userId, '+', user.balance, after_balance, amount, payboxId, comment, datetime], (err, resQuery) => {
                        if (err) {
                            console.log('err', err);
                            callback(false);
                        } else {
                            callback({
                                success: true,
                                insertId: resQuery.insertId,
                                user
                            });
                        }
                    })
                })
            })
        }
    },
    verificationCardBelongs: (user_id, card_id, callback) => {
        mysqlDb.query('SELECT * FROM user_cards WHERE card_id=? AND user_id=?', [card_id, user_id], (err, res) => {
            if(err) return callback(false);
            const bool = res[0] ? true : false;
            callback(bool);
        });
    }
};

module.exports = data;
