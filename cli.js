#!/usr/bin/env node
const fs = require('fs');
const processData = require('./processData');
const util= require('util');

const args = process.argv.slice(2)
var fileName = args[0];

fs.readFile(fileName, 'utf-8', ((err, inputData) => {
  var processedData = processData(inputData);

  processedData.then(data => {

    var resp = util.inspect(data, { maxArrayLength: null })
    
    console.log(JSON.stringify(resp));
    return JSON.stringify(resp);
  })
}));