require('dotenv').config({ path: 'backend/.env' });
const { evalPII } = require("./evalPII");
const { evalInjection } = require("./evalInjection");
const { evalRetrieval } = require("./evalRetrieval");
const { evalGrounding } = require("./evalGrounding");
const { evalLatency } = require("./evalLatency");
const fs = require("fs");

async function runAll() {
    console.log("AI Guardrails — Full Eval Suite");
    console.log(`Started: ${new Date().toISOString()}\n`);

    const pii = evalPII();
    const injection = await evalInjection();
    const retrieval = await evalRetrieval();
    const grounding = await evalGrounding();
    const latency = await evalLatency();

    const summary = `
AI Guardrails Eval Report
Date: ${new Date().toISOString()}

PII Detection
  Precision: ${(pii.precision * 100).toFixed(1)}%
  Recall:    ${(pii.recall * 100).toFixed(1)}%
  F1 Score:  ${(pii.f1 * 100).toFixed(1)}%

Prompt Injection Detection
  Precision: ${(injection.precision * 100).toFixed(1)}%
  Recall:    ${(injection.recall * 100).toFixed(1)}%
  F1 Score:  ${(injection.f1 * 100).toFixed(1)}%

Retrieval
  Hit Rate:  ${(retrieval.hitRate * 100).toFixed(1)}%
  Hits:      ${retrieval.hits}/${retrieval.hits + retrieval.misses}

Grounding
  Accuracy:  ${(grounding.accuracy * 100).toFixed(1)}%
  Correct:   ${grounding.correct}/${grounding.correct + grounding.incorrect}

Latency
  Average:   ${latency.avg}ms
  Median:    ${latency.p50}ms
  P95:       ${latency.p95}ms
  P99:       ${latency.p99}ms
  Min:       ${latency.min}ms
  Max:       ${latency.max}ms
`;

    console.log(summary);
    fs.writeFileSync("eval/eval-report.txt", summary);
    console.log("Report saved to eval/eval-report.txt");
}

runAll().then(() => process.exit(0)).catch(err => {
    console.error("Eval failed:", err);
    process.exit(1);
});