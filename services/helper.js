const data = {
    rang: (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    },
    randomString: () => {
        return (Math.random().toString(36).substring(2, 16) + Math.random().toString(36).substring(2, 16)).toUpperCase();
    },
    extImage: (filename) => {
        if (!filename) return false;
        let ext = filename.split('.').pop().toLowerCase();
        if(ext === 'heic'){
            ext = 'jpg';
        }
        if (['png', 'jpg', 'jpeg'].includes(ext)) {
            return ext
        } else {
            return false;
        }
    },
    reformatDateString(date){
        if(!date) return null;
        return date.split("-").reverse().join("-");
    },
    ksort: (obj) => {
        let keys = Object.keys(obj).sort()
            , sortedObj = {};

        for (let i in keys) {
            sortedObj[keys[i]] = obj[keys[i]];
        }

        return sortedObj;
    }
};

module.exports = data;