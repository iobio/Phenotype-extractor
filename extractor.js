const spawn = require("child_process").spawn;
const exec = require('child_process').exec
var DiseaseNames = require('./DiseaseNamesCleaned.json');
var natural = require('natural');
var FuzzySet = require('fuzzyset.js');

var processData = require('./processData');

function extractor(notes) {
  const pythonProcess = spawn('python',['./lemmet.py', notes]);

  pythonProcess.stdout.on('data', (data) => {
    var decoder = new TextDecoder('utf-8');
    var decodedData = decoder.decode(data)
    console.log(processData(decodedData))
    return processData(decodedData);
  });
}


module.exports = extractor;
