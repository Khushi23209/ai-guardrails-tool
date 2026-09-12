require('dotenv').config({ path: 'backend/.env' });

const { searchChunks } = require("../backend/vectorSearch");
const testCases = require("./test-cases.json");

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function evalRetrieval() {
    let hits = 0;
    let misses = 0;
    const errors = [];

    console.log("\n=== Retrieval Hit-Rate Eval ===");

    for (const tc of testCases.retrieval) {
        await delay(1500);
        try {
            const results = await searchChunks(tc.query, 5);
            const returnedDocs = results.map(r => r.doc_name);
            const found = returnedDocs.includes(tc.expected_doc);

            if (found) {
                hits++;
            } else {
                misses++;
                errors.push({ query: tc.query, expected: tc.expected_doc, got: returnedDocs });
            }

            const rank = returnedDocs.indexOf(tc.expected_doc) + 1;
            console.log(`  "${tc.query.substring(0, 45)}..." => ${found ? `HIT (rank ${rank})` : "MISS"}`);
        } catch (err) {
            console.log(`  [!] Error: ${tc.query.substring(0, 45)}... ${err.message}`);
            misses++;
        }
    }

    const hitRate = hits / (hits + misses);

    console.log(`\nHits:     ${hits}`);
    console.log(`Misses:   ${misses}`);
    console.log(`Hit Rate: ${(hitRate * 100).toFixed(1)}%`);

    if (errors.length > 0) {
        console.log(`\nMisses (${errors.length}):`);
        errors.forEach(e => {
            console.log(`  "${e.query}" expected: ${e.expected} got: [${e.got.join(", ")}]`);
        });
    }

    return { hits, misses, hitRate };
}

module.exports = { evalRetrieval };

evalRetrieval().then(() => process.exit(0));