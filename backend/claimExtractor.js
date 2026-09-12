const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractClaims(text) {
    const prompt = `You are a claim extractor. Given a text response, extract all individual factual claims that can be verified against reference documents.

        Skip greetings, opinions, questions, and filler phrases. Only extract concrete factual statements.

        Text: "${text}"

        Respond with ONLY valid JSON, no markdown, no backticks:
        [
            {"claim": "the factual claim here"},
            {"claim": "another factual claim"}
        ]

        If there are no factual claims, return an empty array: []`;
    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }]
        });
        const text2 = response.choices[0].message.content;
        const cleaned = text2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found");
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
    } catch (error) {
        console.error("Claim extraction failed:", error.message);
        return [];
    }
}

module.exports = { extractClaims };