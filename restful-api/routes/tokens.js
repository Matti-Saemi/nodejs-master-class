'use strict';

const Helpers = require('../lib/helpers');
const DataLib = require('../lib/data');

const tokens = {};

// Required data: password, phone
tokens.post = (data, callback) => {
  let userData = data.payload;
  let password = Helpers.CheckStringInput(userData.password);
  let phone = Helpers.CheckStringInput(userData.phone, 9);

  if(phone && password) {
    DataLib.read('users', phone, (err, data) => {
      if(!err && data) {
        let hashedPassword = Helpers.Hash(password);
        if(hashedPassword === data.hashedPassword) {
          const tokenId = Helpers.CreateRandomString(20);
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
tokens.get = (data, callback) => {
  const tokenData = data.queryStringObject;
  const tokenId = Helpers.CheckStringInput(tokenData.id, 20);

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
tokens.put = (data, callback) => {
  let tokenData = data.payload;
  
  let tokenId = Helpers.CheckStringInput(tokenData.id,20);
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
tokens.delete = (data, callback) => {
  let query = data.queryStringObject;
  let id = Helpers.CheckStringInput(query.id);

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
tokens.verifyToken = (id, phone, callback) => { 
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


module.exports = tokens;