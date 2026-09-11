const {detectPII} = require("./piiDetector");
const {injectionDetect} = require("./injectionDetector");
const {checkGrounding} = require("./groundingChecker")

async function preCheck(userMessage){
   const piiresults =  detectPII(userMessage);
   const injectionresults = await injectionDetect(userMessage)
   if(piiresults.length  >0){
    console.log(piiresults);
   }
   return { message: userMessage, ppiFindings: piiresults,injectionResult:injectionresults };     
}

async function postCheck(responseMessage){
    const results = detectPII(responseMessage);
    const groundingResult = await checkGrounding(responseMessage);
    if(results.length >0){
        console.log(results);
    }
     console.log("Grounding score:", groundingResult.overallScore);
    return { message: responseMessage, ppiFindings: results, groundingResult: groundingResult };     
}
module.exports = { preCheck, postCheck };