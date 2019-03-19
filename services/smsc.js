const axios = require('axios');

const data = {
    send: (phone, sms, callback) => {
        callback(123, false);
        return;
        axios.post('https://smsc.ru/sys/send.php?login=Admotion&psw=!Q2w3e$R&phones=' + phone + '&mes=' + sms + '&fmt=3')
            .then(function (response) {
                if (response.data.id && response.data.cnt) {
                    //успешная отправка смс
                    callback(response.data.id, false);
                } else {
                    callback(false, response.data.error);
                }
            })
            .catch(function (error) {
                callback(false, 'Ошибка отправке запроса в smsc.ru');
            })
    }
};

module.exports = data;

