const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

        try {
            const response = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                messages: [{ role: "user", content: prompt }]
            });
            const text = response.choices[0].message.content;
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON array found");
            const scores = JSON.parse(jsonMatch[0]);

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