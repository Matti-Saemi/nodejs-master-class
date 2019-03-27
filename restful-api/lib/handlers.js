'use strict';

const DataLib = require('./data');
const helpers = require('./helpers');
// Define the handlers
const handlers = {};
const checkStringInput = (input, minStrLength = 0) => {
  return typeof(input) === 'string' && input.trim().length > minStrLength ? input : false;
}

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for the tokesn submethods
handlers._tokens = {};

// Required data: password, phone
handlers._tokens.post = (data, callback) => {
  let userData = data.payload;
  let password = checkStringInput(userData.password);
  let phone = checkStringInput(userData.phone, 9);

  if(phone && password) {
    DataLib.read('users', phone, (err, data) => {
      if(!err && data) {
        let hashedPassword = helpers.hash(password);
        if(hashedPassword === data.hashedPassword) {
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObj = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires
          };
          DataLib.create('tokens', tokenId, tokenObj, err => {
            if(err) {
              callback(500, {'Error': 'Could not create new token'});
            } else {
              callback(200, tokenObj);
            }
          });
        } else {
          callback(400, {'Error':'Password did not match'});
        }
      } else {
        callback(400, {'Error': 'Could not find the user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}

// Required data: id
handlers._tokens.get = (data, callback) => {
  const tokenData = data.queryStringObject;
  const tokenId = checkStringInput(tokenData.id, 20);

  if(tokenId){
    DataLib.read('tokens', tokenId, (err, data) => {
      if(!err && data) {
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}

// Required data: id, extend
handlers._tokens.put = (data, callback) => {
  let tokenData = data.payload;
  
  let tokenId = checkStringInput(tokenData.id,20);
  let extend = typeof(tokenData.extend) === 'boolean' && tokenData.extend === true ? tokenData.extend : false;

  if(tokenId && extend) {
    DataLib.read('tokens', tokenId, (err, data) => {
      const expires = data.expires;
      
      if(!err && data) {
        if(expires > Date.now()) {
          const newExpires = Date.now() + 1000 * 60 * 60;
          let tokenObj = {...data, ...{'expires': newExpires}};
          DataLib.update('tokens', tokenId, tokenObj, err => {
            if(err) {
              callback(500, {'Error': 'Could not create new token'});
            } else {
              callback(200, tokenObj);
            }
          });
        } else {
          callback(404, {'Error': 'Token has already been expired'});
        }
        
      } else {
        callback(404, {'Error': 'Could not find the token'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}

// Required data: id
handlers._tokens.delete = (data, callback) => {
  let query = data.queryStringObject;
  let id = checkStringInput(query.id);

  if(id) { 
    DataLib.read('tokens', query.id, (err, data) => {
      if(!err && data) {
        DataLib.delete('tokens', query.id, () => {
          if(err) {
            callback(500, "This tokens can not be deleted");
          } else {
            callback(200, {});
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

// Required data: id, phone
handlers._tokens.verifyToken = (id, phone, callback) => { 
  DataLib.read('tokens', id, (err, tokenData) => {
    if(!err && tokenData) {
      if(tokenData.phone == phone && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.includes(data.method)){
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the user submethods
handlers._users = {};

// Users - post
// Required data: fisrtName, lastName, phone, password, tosAggreement
handlers._users.post = (data, callback) => {
  let userData = data.payload;
  let firstName = checkStringInput(userData.firstName);
  let lastName = checkStringInput(userData.lastName);
  let password = checkStringInput(userData.password);
  let phone = checkStringInput(userData.phone, 9);
  let tosAggreement = typeof(userData.tosAggreement) === 'boolean' && userData.tosAggreement === true ? true : false;

  if(firstName && lastName && phone && password && tosAggreement) {
    DataLib.read('users', phone, (err, data) => {
      if(err) {
        // Hash password
        let hashedPassword = helpers.hash(password);

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
handlers._users.get = (data, callback) => {
  let query = data.queryStringObject;
  if(checkStringInput(query.phone)) {
    const token = checkStringInput(data.headers.token, 20);
    handlers._tokens.verifyToken(token, query.phone, isValid => {
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

// TODO : only authenticated users can access their own object
handlers._users.put = (data, callback) => {
  const phone = checkStringInput(data.payload.phone);
  const firstName = checkStringInput(data.payload.firstName);
  const lastName = checkStringInput(data.payload.lastName);
  const password = checkStringInput(data.payload.password);

  if(phone) {
    if(firstName || lastName || password) {
      const token = checkStringInput(data.headers.token, 20);
      handlers._tokens.verifyToken(token, query.phone, isValid => {
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
handlers._users.delete = (data, callback) => {
  let query = data.queryStringObject;
  let phone = checkStringInput(query.phone);
  if(phone) {
    const token = checkStringInput(data.headers.token, 20);
    handlers._tokens.verifyToken(token, query.phone, isValid => {
      if(isValid) {
        DataLib.read('users', query.phone, (err, data) => {
          if(!err && data) {
            DataLib.delete('users', query.phone, () => {
              if(err) {
                callback(500, "This user can not be deleted");
              } else {
                callback(200, {});
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


handlers.sample = (data, callback) => {
  // Callback a http status code and a payload object
  callback(200, {'name' : 'sample handler'});
};

handlers.ping = (data, callback) => {
  // Callback a http status code and a payload object
  callback(200, 'OK!');
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
