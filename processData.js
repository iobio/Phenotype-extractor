const spawn = require("child_process").spawn;
const exec = require('child_process').exec
var DiseaseNames = require('./DiseaseNamesCleaned.json');
var natural = require('natural');
var FuzzySet = require('fuzzyset.js');


function processData(data){
  console.log("data in processData")
  Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    },
    enumerable: true,
    configurable: true
  });

  return new Promise(function(resolve, reject) {
    var arr = data.split(',').join(':').trim().split(';').join(':').trim()
                  .split('.').join(':').trim().split('but').join(':').trim()
                  .split('\n').join(':').trim().split(':');
                  // .split('of').join(':').trim()

    arr.map((x, i) => {
      if(x.includes("and")){
        if(x.includes("not") || x.includes("does not") || x.includes("doesn't")){
          arr[i] = x.split('and')
        }
      }
    })
    arr = arr.flat();

    res = checkForNegativeFlags(arr)
    res1 = checkForFamilyFlags(res);
    console.log("res1", res1);
    res2 = checkForFlaggedWords(res1);
    console.log("res1", res2);


    var results = [];
    var fuzzyResults = [];
    var LevenshteinResults = [];
    for(var i=0; i<res2.length; i++){
      for(var j=0; j<DiseaseNames.data.length; j++){
        var sentence = res2[i].replace(/-/g, " ").replace(/\s\s+/g, ' ').toLowerCase().trim();
        sentence = sentence.replace("disease", "");
        sentence = sentence.replace("syndrome", "");
        var condition = DiseaseNames.data[j].DiseaseName.replace(/-/g, " ").replace(/\s\s+/g, ' ').toLowerCase().trim();
        condition = condition.replace("disease", "");
        condition = condition.replace("syndrome", "");
        if(sentence === "tof"){
          sentence = "tetralogy of fallot"
        }
        else if(sentence === "dd"){
          sentence = "developmental delay"
        }
        else if(sentence === "mpph"){
          sentence = "megalencephaly polymicrogyria polydactyly hydrocephalus"
        }
        else if(sentence === "CDG"){
          sentence = "Congenital disorder of glycosylation"
        }
        //TODO: Find exact word match in the sentence using boundaries of regex and then replace. 
        // if(sentence === "hypotonia" || sentence === "epilepsy" || sentence === "joint contracture"){
        //   if(!results.includes(sentence)){
        //     results.push(sentence);
        //   }
        // }
        if(sentence.length>= condition.length){
          if(condition!== "disease" && condition!== "Disease" && condition.length>2 ){
            if(sentence.includes(condition) || natural.JaroWinklerDistance(sentence, condition) > 0.9){
              if(!results.includes(DiseaseNames.data[j].DiseaseName) ){

                if(natural.JaroWinklerDistance(sentence, condition) > 0.88){
                  results.push(DiseaseNames.data[j].DiseaseName);
                }

                var LevenshteinFormula = natural.LevenshteinDistance(condition, sentence, {search: true});
                var LevenshteinFormulaDistance = LevenshteinFormula.distance;

                if(LevenshteinFormulaDistance<=1){
                  LevenshteinResults.push(DiseaseNames.data[j].DiseaseName);
                }

                var a = FuzzySet();
                a.add(sentence);
                if(a.get(condition)!== null && a.get(condition)[0][0]> 0.86){
                  fuzzyResults.push(DiseaseNames.data[j].DiseaseName);
                }

              }
            }
          }
        }
        else if(sentence.length < condition.length){

          if(condition!== "disease" && condition!== "Disease" && condition.length>2 && sentence.length>2) {
            if(condition.includes(sentence) || natural.JaroWinklerDistance(sentence, condition) > 0.9){
              if(!results.includes(DiseaseNames.data[j].DiseaseName) ){

                if(natural.JaroWinklerDistance(sentence, condition) > 0.88){
                  results.push(DiseaseNames.data[j].DiseaseName);
                }

                var LevenshteinFormula = natural.LevenshteinDistance(sentence, condition, {search: true});
                var LevenshteinFormulaDistance = LevenshteinFormula.distance;

                if(LevenshteinFormulaDistance<=2){
                  LevenshteinResults.push(DiseaseNames.data[j].DiseaseName);
                }


                var a = FuzzySet();
                a.add(sentence);
                if(a.get(condition)!== null && a.get(condition)[0][0]> 0.86){
                  fuzzyResults.push(DiseaseNames.data[j].DiseaseName);
                }
              }
            }
          }
        }
        else{
        }
      }
    }
    resolve({JaroWinkler:results, fuzzyResults: fuzzyResults, LevenshteinResults:LevenshteinResults })
  });
}


function checkForNegativeFlags(arr){
  const negativeFlags = ["negative", "non", "never", "without", "denies","no", "not", "none"];
  var res = [];
  arr.map(subSentence => {
    words = subSentence.trim().split(" ")
    var found = negativeFlags.some(flag => words.includes(flag));
    !found ? res.push(subSentence) : "";
  })
  return res;
}

function checkForFamilyFlags(arr){
  const familyFlag = ["cousin", "parent", "mom", "mother", "dad", "father", "grandmother", "grandfather", "grandparent", "family", "brother", "sister", "sibling", "uncle", "aunt", "nephew", "niece", "son", "daughter", "grandchild"];
  var res1 = [];
  arr.map(subSentence => {
    words = subSentence.trim().split(" ")
    var found = familyFlag.some(flag => words.includes(flag));
    !found ? res1.push(subSentence) : "";
  })
  return res1;
}

function checkForFlaggedWords(arr){
  const flaggedWords = ["possible", "possibly", "relative", "small", "-", "global", "again", "before", "after", "patient", "ha"];
  var res1 = [];
  arr.map(subSentence => {
    words = subSentence.toLowerCase().trim().split(" ");
    var found = words.filter(i => !flaggedWords.includes(i)); //match two arrays and remove the matched terms
    var temp = found.join(" ")
    res1.push(temp);
  })
  return res1;
}


module.exports = processData;
