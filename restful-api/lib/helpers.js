'use strict';

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

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

Helpers.SendTwilioSms = (phone, msg, callback) => {
    phone = Helpers.CheckStringInput(phone, 7);
    msg = Helpers.CheckStringInput(msg);

    if(phone && msg) {
        let payload = {
            'From' : config.twilio.fromPhone,
            'To' : `+65${phone}`,
            'Body' : msg
        }
        let stringPayload = querystring.stringify(payload);
        let requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth' : `${config.twilio.accountSid}:${config.twilio.authToken}`,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        const request = https.request(requestDetails, res => {
            if(res.statusCode == 200 || res.statusCode == 201) {
                callback(false);
            } else {
                callback(`Status code return was ${res.statusCode}`);
            }
        });

        request.on('error', err => {
            callback(err);
        });

        request.write(stringPayload);
        request.end();
    } else {
        callback('Giving parameters were missing or invalid');
    }
}

module.exports = Helpers;