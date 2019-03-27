'use strict';

const crypto = require('crypto');
const config = require('./config');

const helpers = {};

helpers.hash = function(str) {
    if(typeof(str) === 'string' && str.trim().length > 0){
        return crypto.createHmac('SHA256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
};

helpers.parseJsonToObject = (str) => {
    try {
        let obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {};
    }
};

helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength) {
        const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randStr = '';
        for(let i = 0; i <= strLength; i++) {
            randStr += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }
        return randStr;
    } else {
        return false;
    }
};

module.exports = helpers;