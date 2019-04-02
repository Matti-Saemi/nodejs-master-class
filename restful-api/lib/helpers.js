'use strict';

const crypto = require('crypto');
const config = require('./config');

const Helpers = {};

Helpers.Hash = function(str) {
    if(typeof(str) === 'string' && str.trim().length > 0){
        return crypto.createHmac('SHA256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
};

Helpers.ParseJsonToObject = (str) => {
    try {
        let obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {};
    }
};

Helpers.CreateRandomString = (strLength) => {
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


Helpers.CheckStringInput = (input, minStrLength = 0) => {
    return typeof(input) === 'string' && input.trim().length > minStrLength ? input : false;
  }

module.exports = Helpers;