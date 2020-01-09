#!/usr/bin/env node

const fs = require('fs');

const extractor = require('./extractor');
const processData = require('./processData');

const spawn = require("child_process").spawn;
const exec = require('child_process').exec
const DiseaseNames = require('./DiseaseNamesCleaned.json');
const natural = require('natural');
const FuzzySet = require('fuzzyset.js');
const util= require('util');

const args = process.argv.slice(2)

var fileName = args[0];

console.log("Initiating phenotype extraction...")
console.log("file name is: ", fileName);

fs.readFile(fileName, 'utf-8', ((err, data) => {
  console.log("data in file is: ", data)
  runPhenotypeExtractor(data);
}));


function runPhenotypeExtractor(notes){
  const pythonProcess = spawn('python',['./lemmet.py', notes]);

  pythonProcess.stdout.on('data', (data) => {
    var decoder = new util.TextDecoder('utf-8');
    var decodedData = decoder.decode(data);
    console.log("data after running python script: ", decodedData)
    var processedData = processData(decodedData);
    processedData.then(data => {
      console.log(data)
      return data
    })
  });
}
