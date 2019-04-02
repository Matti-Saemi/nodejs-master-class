'use strict';

const Helpers = require('../lib/helpers');
const DataLib = require('../lib/data');
const config = require('../lib/config');
const tokenMethods = require('./tokens');
const checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
checks.post = (data, callback) => {
  const checkData = data.payload;
  let protocol = Helpers.CheckStringInput(checkData.protocol);
  protocol = ['http', 'https'].includes(protocol) ? protocol : false;
  let url = Helpers.CheckStringInput(checkData.url);
  let method = Helpers.CheckStringInput(checkData.method);
  method = ['post', 'get', 'put', 'delete'].includes(method) ? method : false;
  let successCodes = typeof(checkData.successCodes) === 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length > 0 ? checkData.successCodes : false;
  let timeoutSeconds = typeof(checkData.timeoutSeconds) === 'number' && checkData.timeoutSeconds % 1 === 0 && checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;

  if(protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers
    let tokens = Helpers.CheckStringInput(data.headers.token);
    DataLib.read('tokens', tokens, (err, tokenData) => {
      if(!err && tokenData) {
        let userPhone = tokenData.phone;
        DataLib.read('users', userPhone, (err, userData)=> {
          if(!err && userData) {
            let userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

            if(userChecks.length < config.maxChecks) {
              const checkId = Helpers.CreateRandomString(20);
              const checkObject = {
                'id' : checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method' : method,
                'successCodes' : successCodes,
                'timeoutSeconds' : timeoutSeconds,
              };

              DataLib.create('checks', checkId, checkObject, err => {
                if(err) {
                  callback(500, {'Error': 'Could not create the new check'})
                } else {
                  userData.checks = userChecks;
                  userData.checks.push(checkObject.id);
                  DataLib.update('users', userPhone, userData, err => {
                    if(!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {'Error': 'Could not update the user with the new check'})
                    }
                  });
                }
              });
            } else {
              callback(400, {'Error': `The user already has the maximum number of checks(${config.maxChecks})`});
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required inputs or inputs are invalid'});
  }
}

// Required data: id
checks.get = (data, callback) => {
  const id = Helpers.CheckStringInput(data.queryStringObject.id, 20);

  if(id){
    DataLib.read('checks', id, (err, checkData) => {
      if(!err && checkData) {
        const token = Helpers.CheckStringInput(data.headers.token, 20);
        tokenMethods.verifyToken(token, checkData.userPhone, isValid => {
          if(isValid) {
            callback(200, checkData);
          } else {
            callback(403, {'Error' : 'Missing the required token in the header or the token is not valid'});
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}

// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds (one must be set)
checks.put = (data, callback) => {
  const checkPayload = data.payload;
  let id = Helpers.CheckStringInput(checkPayload.id, 20);
  let protocol = Helpers.CheckStringInput(checkPayload.protocol);
  protocol = ['http', 'https'].includes(protocol) ? protocol : false;
  let url = Helpers.CheckStringInput(checkPayload.url);
  let method = Helpers.CheckStringInput(checkPayload.method);
  method = ['post', 'get', 'put', 'delete'].includes(method) ? method : false;
  let successCodes = typeof(checkPayload.successCodes) === 'object' && checkPayload.successCodes instanceof Array && checkPayload.successCodes.length > 0 ? checkPayload.successCodes : false;
  let timeoutSeconds = typeof(checkPayload.timeoutSeconds) === 'number' && checkPayload.timeoutSeconds % 1 === 0 && checkPayload.timeoutSeconds >= 1 && checkPayload.timeoutSeconds <= 5 ? checkPayload.timeoutSeconds : false;

  if(id) {
    if(protocol || url || method || successCodes || timeoutSeconds) {
      DataLib.read('checks', id, (err, checkData) => {
        if(!err && data) {
          const token = Helpers.CheckStringInput(data.headers.token, 20);
          tokenMethods.verifyToken(token, checkData.userPhone, isValid => {
            if(isValid) {
              if(protocol) {
                checkData.protocol = protocol;
              }
              if(url) {
                checkData.url = url;
              }
              if(method) {
                checkData.method = method;
              }
              if(successCodes) {
                checkData.successCodes = successCodes;
              }
              if(timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              DataLib.update('checks', id, checkData, err => {
                if(err){ 
                  callback(500, {'Error' : 'Check Data could not be updated'})
                } else {
                  callback(200);
                }
              })
            } else {
              callback(403, {'Error':'The Token is not valid'});
            }   
          });
        } else {
          callback(404, {'Error': 'Check ID did not exist'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing required fields'});
    }
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}

// Required data: id
checks.delete = (data, callback) => {
  let id = Helpers.CheckStringInput(data.queryStringObject.id);

  if(id) { 
    DataLib.read('checks', id, (err, checkData) => {
      if(!err && checkData) {
        const token = Helpers.CheckStringInput(data.headers.token);
        tokenMethods.verifyToken(token, checkData.userPhone, isValid => {
          if(isValid) {
            DataLib.delete('checks', id, err => {
              if(err){ 
                callback(500, {'Error' : 'Check could not be deleted'})
              } else {
                DataLib.read('users', checkData.userPhone, (err, userData) => {
                  if(!err && userData) {
                    let userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                    let checkPosition = userChecks.indexOf(id);
                    if(checkPosition > -1) {
                      console.log(userData)

                      userChecks.splice(checkPosition, 1);
                      userData.checks = userChecks;
                      console.log(userData)

                      DataLib.update('users', userData.phone, userData, err => {
                        if(!err) {
                          callback(200);
                        } else {
                          console.log(err)
                          callback(500, { 'Error': 'Could not delete the check from user object'});
                        }
                      });
                    }
                  } else {
                    callback(500, { 'Error': 'Could not find the user who created this check'});
                  }
                });
              }
            });
          } else {
            callback(403);
          }  
        }); 
      } else {
        callback(400, {'Error' : 'The specified check ID does not exist'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

module.exports = checks;