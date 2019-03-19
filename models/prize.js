const mysqlDb = require('../services/mysql');
const pool = require('../services/pool');
const userModel = require('../models/user');

const data = {
    async getAllPartners(callback){
        let users = await pool.query(`select users.id, users.name, users.avatar from users 
                        right join prizes
                        on prizes.user_id = users.id
                        where users.active = 1
                        group by users.id`);

        for (let i in users) {
            let prizes = await pool.query('select * from prizes where user_id=? AND quantity>0', users[i].id);
            users[i].prizes = prizes;
        }
        callback(users);
    },
    getPrizesByUserId(userId, callback){
        mysqlDb.query('SELECT * FROM prizes WHERE user_id = ?', [userId], (err, res)=>{
            if(err) {
                callback(false);
            }else{
                callback(res);
            }

        })
    },
    addPrize: (data, user, callback) => {
        mysqlDb.query('INSERT INTO prizes (title, user_id, quantity, start_amount, coefficient, img, type) VALUES (?,?,?,?,?,?,?) ', [data.title, user.id, data.quantity, data.start_amount, data.coefficient, data.img, data.type], (err, resQuery) => {
            if (err) {
                console.log('err', err.sql);
                callback(false);
            } else {
                callback(resQuery);
            }
        })
    },
    rangWinningPrize: (prizes)=>{
        let duplicatePrizes = [];
        prizes.forEach(item=>{
            for(let i = 0; i< item.coefficient;++i){
                duplicatePrizes.push(item)
            }
        });
        //random prize
        let winningPrize = duplicatePrizes[Math.floor(Math.random() * duplicatePrizes.length)];
        return winningPrize;

    },
    addPrizeWinning: (userId, amount, balanceHistoryId, prize, callback) => {
        let datetime = new Date().toLocaleString();
        let received = 0;
        let message = '';
        if(prize.type === 'cashback'){
            received = 1;
            let cashbackAmount = (amount * parseInt(prize.value)) / 100;
            cashbackAmount = parseInt(cashbackAmount);
            message = 'Начисление кэшбек: '+cashbackAmount+'тг.';
            userModel.balanceIncrement(userId, cashbackAmount, null, 'Начисление кэшбек: '+prize.title, (res)=>{
            })
        }
        mysqlDb.query('INSERT INTO prize_winnings (partner_id, user_id, prize_id, received, balance_history_id, date) VALUES (?,?,?,?,?,?)',
            [prize.user_id, userId, prize.id, received, balanceHistoryId, datetime], (err, res) => {
                if (err) return callback(false);
                mysqlDb.query('UPDATE prizes SET quantity=quantity-1 WHERE id=?', [prize.id], (err, res) => {
                    if (err) return callback(false);
                    prize.message = message;
                    callback(prize);
                });
            }
        );
    },
    getWinningDiscount(userId, partnerId, callback){
        //выбор discount нужно будет вывести при сканирование qr
        mysqlDb.query(`SELECT * FROM prize_winnings
                       INNER JOIN prizes
                       ON prize_winnings.prize_id = prizes.id
                       WHERE type IN ('discount') 
                       AND prize_winnings.received=0
                       AND prize_winnings.user_id=?
                       AND prize_winnings.partner_id=?
                         `, [userId, partnerId], (err, resDiscount) => {
            if(err) console.log('err', err);
            callback(resDiscount[0]);
        });
    }
};

module.exports = data;
