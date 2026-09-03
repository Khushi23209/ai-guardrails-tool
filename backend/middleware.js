const {detectPII} = require("./piiDetector");
const {injectionDetect} = require("./injectionDetector");


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
    if(results.length >0){
        console.log(results);
    }
    return { message: responseMessage, ppiFindings: results };     
}
module.exports = { preCheck, postCheck };