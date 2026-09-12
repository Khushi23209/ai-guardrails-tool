require('dotenv').config({ path: 'backend/.env' });
const { retrieve } = require("../backend/retriever");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const testCases = require("./test-cases.json");

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function evalGrounding() {
    let correct = 0;
    let incorrect = 0;
    const errors = [];

    const allCases = [
        ...testCases.grounding.supported,
        ...testCases.grounding.contradicted
    ];

    console.log("\n=== Grounding Eval ===");

    for (const tc of allCases) {
        await delay(3000);
        try {
            const chunks = await retrieve(tc.claim, 3);

            const prompt = `You are a grounding evaluator. Given a claim and evidence chunks, score how well the evidence supports the claim.

                Claim: "${tc.claim}"

                Evidence:
                ${chunks.map((c, i) => `[${i}] (${c.doc_name}): ${c.chunk_text}`).join('\n\n')}

                Score from 0.0 to 1.0:
                - 0.0-0.3: Contradicted by evidence
                - 0.3-0.7: Not enough info
                - 0.7-1.0: Supported by evidence

                Respond with ONLY valid JSON, no markdown, no backticks:
                {
                    "score": 0.85,
                    "verdict": "supported" or "not_enough_info" or "contradicted"
                }`;

            const response = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                messages: [{ role: "user", content: prompt }]
            });
            const text = response.choices[0].message.content;
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON object found");
            const parsed = JSON.parse(jsonMatch[0]);

            const isCorrect = parsed.verdict === tc.expected_verdict;
            if (isCorrect) {
                correct++;
            } else {
                incorrect++;
                errors.push({
                    claim: tc.claim,
                    expected: tc.expected_verdict,
                    got: parsed.verdict,
                    score: parsed.score
                });
            }

            console.log(`  [${isCorrect ? "OK" : "WRONG"}] "${tc.claim.substring(0, 50)}..." expected: ${tc.expected_verdict} got: ${parsed.verdict} (${parsed.score})`);
        } catch (err) {
            console.log(`  [!] Error: "${tc.claim.substring(0, 50)}..." ${err.message}`);
            incorrect++;
        }
    }

    const accuracy = correct / (correct + incorrect);

    console.log(`\nCorrect:   ${correct}`);
    console.log(`Incorrect: ${incorrect}`);
    console.log(`Accuracy:  ${(accuracy * 100).toFixed(1)}%`);

    if (errors.length > 0) {
        console.log(`\nMisclassifications (${errors.length}):`);
        errors.forEach(e => {
            console.log(`  "${e.claim.substring(0, 50)}..." expected: ${e.expected} got: ${e.got} (score: ${e.score})`);
        });
    }

    return { correct, incorrect, accuracy };
}

module.exports = { evalGrounding };

if (require.main === module) {
    evalGrounding().then(() => process.exit(0));
}