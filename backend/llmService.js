const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const { searchChunks } = require("./vectorSearch");

async function getChatResponse(userMessage) {
    let context = "";
    try {
        const chunks = await searchChunks(userMessage, 5);
        context = chunks.map(c => c.chunk_text).join("\n\n");
    } catch (err) {
        console.error("Context retrieval failed:", err.message);
    }

    const systemPrompt = context
    ? `You are TechNova's customer support assistant. Answer ONLY from the reference information below. Keep answers short and specific. If something is not covered in the references, say "That's not covered in our current policies."\n\nReference:\n${context}`
    : "You are a helpful assistant.";

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ]
    });
    return response.choices[0].message.content;
}

module.exports = { getChatResponse };