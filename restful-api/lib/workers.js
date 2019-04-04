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
        if(!err && checks && checks.lenght > 0) {
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
    originalCheckData.userPhone = Helpers.CheckStringInput(originalCheckData.userPhone,  10);
    originalCheckData.protocol = Helpers.CheckStringInput(originalCheckData.protocol);
    originalCheckData.protocol = ['https', 'http'].includes(originalCheckData.protocol)? originalCheckData.protocol : false;
    originalCheckData.url = Helpers.CheckStringInput(originalCheckData.url);
    originalCheckData.method = Helpers.CheckStringInput(originalCheckData.method);
    originalCheckData.method = ['post', 'get', 'put', 'delete'].includes(originalCheckData.method)? originalCheckData.method : false;
    originalCheckData.successCodes = Helpers.CheckStringInput(originalCheckData.successCodes);
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
      console.log("Error: one of the checks is not properly formatted. Skipping.");
    }
};

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.init = () => {
    workers.gatherAllChecks();
    workers.loop();
    console.log('Workers are initilizing ....')
};

module.exports = workers;