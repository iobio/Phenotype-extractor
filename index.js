const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const extractor = require('./extractor');
const app = express();
const port = process.env.PORT || 4047;

const processData = require('./processData');

const spawn = require("child_process").spawn;
const exec = require('child_process').exec
const DiseaseNames = require('./DiseaseNamesCleaned.json');
const natural = require('natural');
const FuzzySet = require('fuzzyset.js');
app.use(cors());
const util= require('util');


// Example url: /phenotype-extractor/?notes=Progressive%20neurologic%20disease,%20intractable%20seizures,%20hypotonia,%20profound%20global%20and%20growth%20delays,%20possible%20infantile%20spasms,%20possibly%20epilepsy%20or%20encephalopathic%20syndrome
app.get('/phenotype-extractor', (req, res) => {
  var notes = req.query.notes;

  const pythonProcess = spawn('python',['./lemmet.py', notes]);

  pythonProcess.stdout.on('data', (data) => {
    var decoder = new util.TextDecoder('utf-8');
    var decodedData = decoder.decode(data);
    console.log("decodedData", decodedData)

    var processedData = processData(decodedData);
    processedData.then(data => {
      console.log(data);
      res.send(data);
    })
  });
})

app.listen(port, () => console.log(`Listening on port ${port}`));
