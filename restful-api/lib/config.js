'use strict';

const envType = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging';

let environment = {};

environment.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envType': 'staging',
  'hashingSecret' : 'thisIsStagingSecret',
  'maxChecks' : 5,
};

environment.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envType': 'production',
  'hashingSecret' : 'thisIsProductionSecret',
  'maxChecks' : 5,
};

let environmentToExport = environment[envType];

module.exports = environmentToExport;
