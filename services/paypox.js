const axios = require('axios');
const helper = require('./helper');
const md5 = require('md5');
const payboxModel = require('../models/paybox');
const userModel = require('../models/user');
const xmlParse = require('xml2js').parseString;

const MERCHANT_ID = '511867';
const SECRET_KEY = 'y7crxXTrz6SXKPNd';

function makeSign(uri, params, secretKey, sort = true) {
    let string = makeSigStr(uri, params, secretKey, sort);
    return {
        md5: md5(string),
        format: string
    };
}

function makeSigStr(uri, params, secretKey, sort = true) {
    delete params.pg_sig;
    // delete params.pg_salt;
    if (sort) {
        params = helper.ksort(params);
    }

    params = {...params, secretKey};

    if(uri) {
        params = {uri, ...params};
    }
    return Object.values(params).join(";");
}

const get = (uri, data, callback, onError) => {
    const salt = helper.rang(21, 43433).toString();

    let params = {
            pg_merchant_id: MERCHANT_ID,
            pg_salt: salt
        };

    const endUri = uri.split('/').pop();


        params = {...params, ...data};
        const sing = makeSign(endUri, params, SECRET_KEY);
        params.pg_sig = sing.md5;
        const url = 'https://paybox.kz/v1/merchant/' + MERCHANT_ID + '/' + uri;
        console.log('url', url);
        console.log('params', params);
        axios.post(url, params)
            .then(function (response) {
                xmlParse(response.data, {trim: false, explicitArray: false}, (err, result) => {
                    callback({
                        url: url,
                        pg_sig_format: sing.format,
                        params: params,
                        response: result,
                        responseXml: response.data,
                    });
                });
            })
            .catch(function (error) {
                console.log(error);
            });
    }



const test = (uri1, uri2, data, callback, onError) => {
    const salt = helper.rang(21, 43433).toString();

    let params = {
        pg_merchant_id: MERCHANT_ID,
        pg_salt: salt
    };


    params = {...params, ...data};
    const sing = makeSign(uri2, params, SECRET_KEY);
    params.pg_sig = sing.md5;
    const url = 'https://paybox.kz/v1/merchant/' + MERCHANT_ID + '/' + uri1+ '/'+uri2;
    console.log('url', url);
    console.log('params', params);
    axios.post(url, params)
        .then(function (response) {
            console.log(response.data);
            callback({
                url: url,
                pg_sig_format: sing.format,
                params: params,
                response: response.data
            });
        })
        .catch(function (error) {
            console.log(error);
        });
}

const cardPay = (user, pg_payment_id, callback) => {
    payboxModel.addOrder(user, (orderId) => {
        // console.log(orderId);
        const data = {
            pg_payment_id: pg_payment_id,
        };
        const uri = 'card/pay';
        get(uri, data, (response) => {
            payboxModel.updateOrder(orderId, uri, response, (resQuery) => {
                const resHtml = response.responseXml;
                if(resHtml){
                    callback({
                        success: true,
                        html: resHtml
                    })
                }else{
                    callback({
                        success: false,
                        error: resData.pg_error_description ? resData.pg_error_description : 'Оплата не удалась!'
                    })
                }
            });
        })
    });
}

const data = {
    //принимает get запрос для теста
    //пример http://localhost:3000/paybox/cardstorage/add?pg_user_id=1&pg_order_id=1&pg_post_link=http://104.248.137.17:3000/paybox/post_link&pg_back_link=http://104.248.137.17:3000/paybox/back_link
    test: (req, res) => {
        test(req.params.uri1, req.params.uri2, req.query, (response)=>{
            res.send(response);
        });
    },
    //не принемает параметров, возвращает html ссылку на страницу с добавлением карты
    cardstorageAdd: (req, res) => {
        payboxModel.addOrder(req.user, (orderId) => {
            console.log(orderId);
            const data = {
                pg_user_id: req.user.id,
                pg_order_id: orderId,
                pg_post_link: 'http://104.248.137.17:3000/paybox/post_link',
                pg_back_link: 'http://104.248.137.17:3000/paybox/back_link'
            };
            const uri = 'cardstorage/add';
            get(uri, data, (response) => {
                payboxModel.updateOrder(orderId, uri, response, (resQuery) => {
                    if(resQuery){
                        res.send(response.response);
                    }
                });
            })
        });
    },
    postLink: (req, res) => {
        let xml = req.body.pg_xml;
        // console.log('req', xml);
        xmlParse(xml, {trim: false, explicitArray: false}, (err, result) => {
            const response = result.response;
            // console.log('res', response);
            let reqSing = response.pg_sig;
            let sing = makeSign('post_link', response, SECRET_KEY);

            //check sing
            if(sing.md5 && reqSing === sing.md5){
                console.log('sing', sing);
                console.log('sing success');
                payboxModel.updateOrderPostLinkData(response.pg_order_id, response, (resQuery) => {
                    if(response.pg_card_id){
                        payboxModel.addUserCard(response.pg_user_id, response.pg_card_id, response.pg_card_hash, response.pg_order_id, (cardInsertId)=>{
                            res.send({
                                success: true
                            });
                        })
                    }
                });
            }
        });
    },
    //страница на принятия запроса о пополнении карты
    cardPayResult: (req, res) => {
        let response = req.body;
        let reqSing = response.pg_sig;
        let sing = makeSign('result_url', response, SECRET_KEY);

        if (sing.md5 && reqSing === sing.md5) {
            console.log('sing', sing);
            console.log('sing success');
            payboxModel.updateOrderPostLinkData(response.pg_order_id, response, (order) => {
                if(response.pg_amount){
                    console.log('resQuery', order);
                    const comment = 'Пополнение картой: '+ response.pg_card_pan;
                    userModel.balanceIncrement(order.user_id, response.pg_amount, response.pg_order_id, comment, resBalance=>{
                        res.send(resBalance);
                    });
                }
            });
        }
    },
    cardPaySuccess: (req, res) => {
        res.send('<h1>Успешная оплата!</h1>');
    },
    cardPayFaile: (req, res) => {
        res.send('<h1>Платеж не удался!</h1>');
    },
    cardstorageList: (req, res) => {
        const data = {
            pg_user_id: req.user.id.toString(),
        };

        get('cardstorage/list', data, (response) => {
            res.send(response);
        })
    },

    cardstorageRemove: (req, res) => {
        const {card_id} = req.body;
        payboxModel.removeUserCard(card_id);
        const data = {
            pg_user_id: req.user.id.toString(),
            pg_card_id: card_id
        };

        get('cardstorage/remove', data, (response) => {
            res.send(response.response.response);
        })
    },
    //только для теста
    cardInit: (req, res) => {
        payboxModel.addOrder(req.user, (orderId) => {
            console.log(orderId);
            const data = {
                pg_amount: 5,
                pg_order_id: orderId.toString(),
                pg_user_id: req.user.id.toString(),
                pg_card_id: '4134592',
                pg_description: 'desc',
                pg_result_url: 'http://104.248.137.17:3000/paybox/back_link',
                pg_success_url: 'http://104.248.137.17:3000/paybox/back_link',
                pg_failure_url: 'http://104.248.137.17:3000/paybox/back_link',
            };
            const uri = 'card/init';
            get(uri, data, (response) => {
                payboxModel.updateOrder(orderId, uri, response, (resQuery) => {
                    if(resQuery){
                        res.send(response.response);
                    }
                });
            })
        });
    },
    //производит пополнение баланса с помощью карты, принимает следующие параметы параметры [amount, card_id, description]
    //ответ отправляет success: true, html: html страница (которую необходимо отрендерить для подтверждения платежа)
    cardPay: (req, res) => {
        const { amount, card_id, description } = req.body;
        const user = req.user;
        userModel.verificationCardBelongs(user.id, card_id, (belongs)=>{
            if(belongs){
                data.cardPayConfirm(user, amount, card_id, description, (resData)=>{
                    res.send(resData);
                })
            }else{
                res.send({
                    success: false,
                    error: 'Данная карта не принадлежит пользователю!'
                })
            }
        });

    },
    //производит пополнение кошелька, card_id - номер карты в системе paybox
    cardPayConfirm: (user, amount, card_id, description, callback) => {
        payboxModel.addOrder(user, (orderId) => {
            // console.log(orderId);
            const data = {
                pg_amount: amount,
                pg_order_id: orderId.toString(),
                pg_user_id: user.id.toString(),
                pg_card_id: card_id.toString(),
                pg_description: description,
                pg_result_url: 'http://104.248.137.17:3000/paybox/card/pay/result_url',
                pg_success_url: 'http://104.248.137.17:3000/paybox/card/pay/success_url',
                pg_failure_url: 'http://104.248.137.17:3000/paybox/card/pay/failure_url',
            };
            const uri = 'card/init';
            get(uri, data, (response) => {
                payboxModel.updateOrder(orderId, uri, response, (resQuery) => {
                    const resData = response.response.response;
                    console.log('resData', resData);
                    if(resData && resData.pg_payment_id){
                        cardPay(user, resData.pg_payment_id, (resPay)=>{
                            callback(resPay);
                        });
                    }else{
                        callback({
                            success: false,
                            error: resData.pg_error_description ? resData.pg_error_description : 'Ошибка в получении заказа paybox'
                        })
                    }
                });
            })
        });
    }
};

module.exports = data;

