'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const DataLib = require('./data');
const Helpers = require('./helpers');

const workers = {};

workers.gatherAllChecks = () => {
    DataLib.list('checks', (err, checks) => {
        if(!err && checks && checks.length > 0) {

            checks.forEach(check => {

                DataLib.read('checks', check, (err, originalCheckData) => {
                    if(!err && originalCheckData) {
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.error('Error: Reading the check data')
                    }
                });
            });
        } else {
            console.error('Error: Could not find any checks to process')
        }
    });
};

workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null? originalCheckData : {};
    originalCheckData.id = Helpers.CheckStringInput(originalCheckData.id, 20);
    originalCheckData.userPhone = Helpers.CheckStringInput(originalCheckData.userPhone,  8);
    originalCheckData.protocol = Helpers.CheckStringInput(originalCheckData.protocol);
    originalCheckData.protocol = ['https', 'http'].includes(originalCheckData.protocol)? originalCheckData.protocol : false;
    originalCheckData.url = Helpers.CheckStringInput(originalCheckData.url);
    originalCheckData.method = Helpers.CheckStringInput(originalCheckData.method);
    originalCheckData.method = ['post', 'get', 'put', 'delete'].includes(originalCheckData.method)? originalCheckData.method : false;
    originalCheckData.successCodes = originalCheckData.successCodes instanceof Array? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // If all checks pass, pass the data along to the next step in the process
  if(originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds){
     
      workers.performCheck(originalCheckData);
    } else {
      // If checks fail, log the error and fail silently
      console.log("Error: one of the checks is not properly formatted. Skipping it.");
    }
};

workers.performCheck = (originalCheckData) => {
    let checkOutcome = {
        'error' : false,
        'responseCode' : false,
    };

    let outcomeSent = false;

    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path;

    const requestDetails = {
        'protocol' : originalCheckData.protocol+':',
        'hostname' : hostname,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000,
    }

    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, res => {
        const status = res.statusCode;
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', err => {
        checkOutcome.error = {
            'error' : true,
            'value' : err   
        }

        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', err => {
        checkOutcome.error = {
            'error' : true,
            'value' : err   
        }

        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
    // Decide if the check is considered up or down
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
  
    // Decide if an alert is warranted
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
  
    // Update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();
  
    // Save the updates
    DataLib.update('checks', newCheckData.id, newCheckData,err => {
      if(!err){
        // Send the new check data to the next phase in the process if needed
        if(alertWarranted){
          workers.alertUserToStatusChange(newCheckData);
        } else {
          console.log("Check outcome has not changed, no alert needed");
        }
      } else {
        console.log("Error trying to save updates to one of the checks");
      }
    });
};
  
  // Alert the user as to a change in their check status
workers.alertUserToStatusChange = newCheckData => {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;

    Helpers.SendTwilioSms(newCheckData.userPhone, msg, err => {
      if(!err){
        console.log("Success: User was alerted to a status change in their check, via sms: ",msg);
      } else {
        console.log("Error: Could not send sms alert to user who had a state change in their check", err);
      }
    });
};


workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.init = () => {
    workers.gatherAllChecks();
    workers.loop();
};

module.exports = workers;