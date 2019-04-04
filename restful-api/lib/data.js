'use strict';

const fs = require('fs');
const path = require('path');
const Helpers = require('./helpers');

// Container for the module
const lib = {};

//Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Create and write into file
lib.create = function(dir, file, data, callback) {
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      let stringData = JSON.stringify(data);

      fs.writeFile(fileDescriptor, stringData, err => {
        if(err) {
          callback('Error writing to new file');
        }

        fs.close(fileDescriptor, err => {
          if(err) {
            callback('Error closing new file');
          }
          callback(false);
        });
      });
    } else {
      callback('Couldn\'t create new file, it may already exist');
    }
  });
};

// Read file
lib.read = function(dir, file, callback) {
  fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if(!err && data) {
      let parsedData = Helpers.ParseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update existing file
lib.update = function(dir, file, data, callback) {
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      let stringData = JSON.stringify(data);
      // Empty the file out
      fs.ftruncate(fileDescriptor, err => {
        if(err) {
          callback('Error truncating file');
        }

        fs.writeFile(fileDescriptor, stringData, err => {
          if(err) {
            callback('Error updating the existing file');
          }

          fs.close(fileDescriptor, err => {
            if(err) {
              callback('Error closing the existing file');
            }
            callback(false);
          });
        });
      });
    }
    else {
      callback('Cloud not open the file to update, it may not exist yet')
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
    if(!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

lib.list = (dir, callback) => {
  fs.readdir(`${lib.baseDir}dir/`, (err, data) => {
    if(!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach(filename => {
        trimmedFileNames.push(filename.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

// export the module
module.exports = lib;
