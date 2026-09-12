require('dotenv').config();
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getChatResponse(userMessage) {
    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            { role: "system", content: "You are a helpful assistant" },
            { role: "user", content: userMessage }
        ]
    });
    return response.choices[0].message.content;
}

module.exports = { getChatResponse };

getChatResponse("What is 2+2?").then(console.log);