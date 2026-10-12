// CALLBACK FUNCTIONS example (classic Node style) + how to turn them into Promises.
// fs.readFile does not return a Promise here - it calls our function when the file has been read.
const fs = require('fs');
const util = require('util');

// Callback version: callback(error, data)
function readJsonFile(filePath, callback) {
  fs.readFile(filePath, 'utf8', (err, text) => {
    if (err) return callback(err);
    try {
      callback(null, JSON.parse(text));
    } catch (parseError) {
      callback(parseError);
    }
  });
}

// util.promisify converts the callback style into a Promise so we can use async/await.
const readJsonFileAsync = util.promisify(readJsonFile);

module.exports = { readJsonFile, readJsonFileAsync };
