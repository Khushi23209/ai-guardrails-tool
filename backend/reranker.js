require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function rerankResults(query, chunks){
    const prompt = `You are a relevance scorer. Given a query and a list of text chunks, score each chunk from 0.0 to 1.0 on how directly it answers the query.

        Query: "${query}"

        Chunks:
        ${chunks.map((c, i) => `[${i}] ${c.chunk_text}`).join('\n\n')}

        Respond with ONLY valid JSON, no markdown, no backticks:
        [
            {"index": 0, "score": 0.95, "reason": "brief reason"},
            {"index": 1, "score": 0.3, "reason": "brief reason"}
        ]`;
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const scores = JSON.parse(cleaned);

            const reranked = scores.map(s => ({
                ...chunks[s.index],
                relevanceScore: s.score,
                reason: s.reason
            }));

            reranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
            return reranked;
        } catch (error) {
            console.error("Reranking failed:", error.message);
            return chunks;
    }
}

module.exports = { rerankResults };
