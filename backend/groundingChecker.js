const { retrieve } = require("./retriever");
const { extractClaims } = require("./claimExtractor");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkGrounding(llmResponse) {
    const claims = await extractClaims(llmResponse);
    if (claims.length === 0) {
        return { overallScore: 1.0, claims: [], message: "No factual claims to verify" };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const results = [];

    for (const c of claims) {
        await delay(2000)
        const chunks = await retrieve(c.claim, 3);
        const prompt = `You are a grounding evaluator. Given a claim and supporting evidence chunks, score how well the evidence supports the claim.

            Claim: "${c.claim}"

            Evidence:
            ${chunks.map((ch, i) => `[${i}] (${ch.doc_name}): ${ch.chunk_text}`).join('\n\n')}

            Score from 0.0 to 1.0:
            - 0.0-0.3: Contradicted by evidence or no relevant evidence found
            - 0.3-0.7: Partially supported or not enough information
            - 0.7-1.0: Strongly supported by evidence

            Respond with ONLY valid JSON, no markdown, no backticks:
            {
                "score": 0.85,
                "verdict": "supported" or "not_enough_info" or "contradicted",
                "reason": "brief explanation",
                "citation": "doc name and relevant text that supports or contradicts"
            }`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            results.push({
                claim: c.claim,
                score: parsed.score,
                verdict: parsed.verdict,
                reason: parsed.reason,
                citation: parsed.citation
            });
        } catch (error) {
            console.error("Grounding check failed for claim:", c.claim, error.message);
            results.push({
                claim: c.claim,
                score: 0.5,
                verdict: "not_enough_info",
                reason: "Grounding check failed",
                citation: null
            });
        }
    }

    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    return { overallScore, claims: results };
}

module.exports = { checkGrounding };