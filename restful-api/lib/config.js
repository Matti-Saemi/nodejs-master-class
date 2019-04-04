'use strict';

const envType = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging';

let environment = {};

environment.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envType': 'staging',
  'hashingSecret' : 'thisIsStagingSecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : 'AC4bb565e781f67276fc96543407765c6c',
    'authToken' : '5bb0d08180a943b622f7aa7c3e820839',
    'fromPhone' : '+6584589705'
  }
};

environment.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envType': 'production',
  'hashingSecret' : 'thisIsProductionSecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : '',
    'authToken' : '',
    'fromPhone' : '',
  }
};

let environmentToExport = environment[envType];

module.exports = environmentToExport;
