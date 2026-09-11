
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractClaims (text){
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const prompt = `You are a claim extractor. Given a text response, extract all individual factual claims that can be verified against reference documents.

        Skip greetings, opinions, questions, and filler phrases. Only extract concrete factual statements.

        Text: "${text}"

        Respond with ONLY valid JSON, no markdown, no backticks:
        [
            {"claim": "the factual claim here"},
            {"claim": "another factual claim"}
        ]

        If there are no factual claims, return an empty array: []`;
    try{
        const result = await model.generateContent(prompt);
       const responseText = result.response.text();
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
       const parsed = JSON.parse(cleaned);
        return parsed;
    }catch (error){
        console.error("Claim extraction failed:", error.message);
        return [];
    }
}
module.exports = { extractClaims };