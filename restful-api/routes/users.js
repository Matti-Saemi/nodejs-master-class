'use strict';

const Helpers = require('../lib/helpers');
const DataLib = require('../lib/data');
const tokenMethods = require('./tokens');

// Container for the user submethods
const users = {};

// Users - post
// Required data: fisrtName, lastName, phone, password, tosAggreement
users.post = (data, callback) => {
  let userData = data.payload;
  let firstName = Helpers.CheckStringInput(userData.firstName);
  let lastName = Helpers.CheckStringInput(userData.lastName);
  let password = Helpers.CheckStringInput(userData.password);
  let phone = Helpers.CheckStringInput(userData.phone, 9);
  let tosAggreement = typeof(userData.tosAggreement) === 'boolean' && userData.tosAggreement === true ? true : false;

  if(firstName && lastName && phone && password && tosAggreement) {
    DataLib.read('users', phone, (err, data) => {
      if(err) {
        // Hash password
        let hashedPassword = Helpers.Hash(password);

        if(hashedPassword){
          let userObjData = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true,
          };
          // Store the user data
          DataLib.create('users', phone, userObjData, (err) => {
            if(err) {
              callback(500, {'Error':'Could not create the new user'});
            }
            callback(200, 'User data has been stored');
          });
        } else {
          callback(500, {'Error':'Could not hash the password'});
        }
      } else {
        callback(400, {'Error': 'A user with that phone number already exists'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Users - get
// Required : phone
// Optional data : none
users.get = (data, callback) => {
  let query = data.queryStringObject;
  if(Helpers.CheckStringInput(query.phone)) {
    const token = Helpers.CheckStringInput(data.headers.token, 20);
    tokenMethods.verifyToken(token, query.phone, isValid => {
      if(isValid) {
        DataLib.read('users', query.phone, (err, data) => {
          if(!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error' : 'Missing the required token in the header or the token is not valid'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

users.put = (data, callback) => {
  const phone = Helpers.CheckStringInput(data.payload.phone);
  const firstName = Helpers.CheckStringInput(data.payload.firstName);
  const lastName = Helpers.CheckStringInput(data.payload.lastName);
  const password = Helpers.CheckStringInput(data.payload.password);

  if(phone) {
    if(firstName || lastName || password) {
      const token = Helpers.CheckStringInput(data.headers.token, 20);
      tokenMethods.verifyToken(token, query.phone, isValid => {
        if(isValid) {
          DataLib.read('users', phone, (err, userData) => {
            if(!err && userData) {
              if(firstName) {
                userData.firstName = firstName;
              }
              if(lastName) {
                userData.lastName = lastName;
              }
              if(password) {
                userData.password = password;
              }
    
              DataLib.update('users', phone, userData, err => {
                if(!err) {
                  callback(200);
                } else {
                  callback(500, {'Error' : 'Could not update the user'});
                }
              });
            } else {
              callback(400, {'Error' : 'The specified user does not exist'});
            }
          });
        } else {
          callback(403, {'Error' : 'Missing the required token in the header or the token is not valid'});
        }
      });
    } else {
      callback(400, {'Error' : 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

// Users - delete
// Required : phone
// Optional data : none
users.delete = (data, callback) => {
  let query = data.queryStringObject;
  let phone = Helpers.CheckStringInput(query.phone);
  if(phone) {
    const token = Helpers.CheckStringInput(data.headers.token, 20);
    tokenMethods.verifyToken(token, query.phone, isValid => {
      if(isValid) {
        DataLib.read('users', query.phone, (err, userData) => {
          if(!err && userData) {
            DataLib.delete('users', query.phone, () => {
              if(err) {
                callback(500, "This user can not be deleted");
              } else {
                let userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                if(userChecks.length > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;
                  userChecks.forEach(checkId => {
                    DataLib.delete('checks', checkId, err => {
                      if(err) {
                        console.log(err)
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == userChecks.length) {
                        if(deletionErrors) {
                          callback(500, {'Error': 'Error encountered while deleting users related checks'});
                        } else {
                          callback(200);
                        }
                      }
                    });
                  });
                }
              }
            });
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error' : 'Missing the required token in the header or the token is not valid'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

module.exports = users;