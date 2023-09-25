var DiseaseNames = require('./DiseaseNamesCleaned.json');
var natural = require('natural');
var FuzzySet = require('fuzzyset.js');
const HPO_Terms = require('./HPO_Terms')

function processData(data){

  return new Promise(function(resolve, reject) {
    //Get HPO ids from the data using the function
    var hpoIds = extractHpoIds(data)

    // replace all the 'but' with a semicolon
    data = data.replace(/\bbut\b/gi, ';' );

    var arr = data.split(',').join(':').trim().split(';').join(':').trim()
                  .split('.').join(':').trim()
                  .split('\n').join(':').trim().split(':');

    arr.map((x, i) => {
      if(/\band\b/gi.test(x)){
        if(/\bnot\b/gi.test(x) || /\bdoes not\b/gi.test(x)  || /\bdoesn't\b/gi.test(x) || /\bdon't\b/gi.test(x)  ){
          // if negation is found split on "and"
          arr[i] = x.split('and') 
        }
      }
    })
    arr = arr.flat();

    res = checkForNegativeFlags(arr)
    res1 = checkForFamilyFlags(res);
    res2 = checkForFlaggedWords(res1);

    var results = [];
    var fuzzyResults = [];
    var LevenshteinResults = [];
    for(var i = 0; i < res2.length; i++){
      for(var j = 0; j<DiseaseNames.data.length; j++){
        var sentence = res2[i].replace(/-/g, " ").replace(/\s\s+/g, ' ').toLowerCase().trim();
        sentence = sentence.replace(/\bdisease\b$/gi, "").replace(/\bsyndrome\b$/gi, ""); //Replaces syndrome or dieases at the end of the word.

        var condition = DiseaseNames.data[j].DiseaseName.replace(/-/g, " ").replace(/\s\s+/g, ' ').toLowerCase().trim();
        condition = condition.replace(/\bdisease\b$/gi, "").replace(/\bsyndrome\b$/gi, "");

        sentence = sentence.replace(/\btof\b/gi, 'tetralogy of fallot')
                           .replace(/\bdd\b/gi, 'developmental delay')
                           .replace(/\bmpph\b/gi, 'megalencephaly polymicrogyria polydactyly hydrocephalus')
                           .replace(/\bCDG\b/gi, 'Congenital disorder of glycosylation')

        if(sentence.length >= condition.length){
          if(condition !== "disease" && condition !== "Disease" && condition.length > 2 ){
            if(sentence.includes(condition) || natural.JaroWinklerDistance(sentence, condition) > 0.9){
              if(!results.includes(DiseaseNames.data[j].DiseaseName) ){

                if(natural.JaroWinklerDistance(sentence, condition) > 0.88){
                  results.push(DiseaseNames.data[j].DiseaseName);
                }

                var LevenshteinFormula = natural.LevenshteinDistance(condition, sentence, {search: true});
                var LevenshteinFormulaDistance = LevenshteinFormula.distance;

                if(LevenshteinFormulaDistance <= 1){
                  LevenshteinResults.push(DiseaseNames.data[j].DiseaseName);
                }

                var a = FuzzySet();
                a.add(sentence);
                if(a.get(condition)!== null && a.get(condition)[0][0] > 0.86){
                  fuzzyResults.push(DiseaseNames.data[j].DiseaseName);
                }

              }
            }
          }
        }
        else if(sentence.length < condition.length){

          if(condition !== "disease" && condition!== "Disease" && condition.length >2 && sentence.length >2) {
            if(condition.includes(sentence) || natural.JaroWinklerDistance(sentence, condition) > 0.9){
              if(!results.includes(DiseaseNames.data[j].DiseaseName) ){

                if(natural.JaroWinklerDistance(sentence, condition) > 0.88){
                  results.push(DiseaseNames.data[j].DiseaseName);
                }

                var LevenshteinFormula = natural.LevenshteinDistance(sentence, condition, {search: true});
                var LevenshteinFormulaDistance = LevenshteinFormula.distance;

                if(LevenshteinFormulaDistance <= 2){
                  LevenshteinResults.push(DiseaseNames.data[j].DiseaseName);
                }


                var a = FuzzySet();
                a.add(sentence);
                if(a.get(condition) !== null && a.get(condition)[0][0] > 0.86){
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
    resolve({JaroWinkler:results, fuzzyResults: fuzzyResults, LevenshteinResults:LevenshteinResults, hpoIds:hpoIds })
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
  const flaggedWords = ["possible", "possibly", "relative", "small", "-", "global", "again", "before", "after", "patient", "ha", "the", "that"];
  var res1 = [];
  arr.map(subSentence => {
    words = subSentence.toLowerCase().trim().split(" ");
    var found = words.filter(i => !flaggedWords.includes(i)); //match two arrays and remove the matched terms
    var temp = found.join(" ")
    res1.push(temp);
  })
  return res1;
}

function extractHpoIds(str){
  var newStr = str; 
  var separators = [',', ';', ' ' ];
  //Split the string on the separators
  var arr = newStr.split(new RegExp(separators.join('|'), 'g'));
  
  var ids = [];

  // if the item in the array is in the HPO_Terms array, push it to the ids array
  arr.map(x => {
    if(HPO_Terms.includes(x)) {
      ids.push(x);
    }
  })

  // remove duplicates if there are any
  var hpoIds = Array.from(new Set(ids));

  // return unique hpoIds
  return hpoIds;
}

module.exports = processData;