require('dotenv').config({ path: 'backend/.env' });
const { injectionDetect } = require("../backend/injectionDetector");
const testCases = require("./test-cases.json");

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function evalInjection() {
    let truePositives = 0;
    let falseNegatives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    const errors = [];

    console.log("\n=== Injection Detection Eval ===");
    console.log("Running positive cases...");

    for (const tc of testCases.injection.positive) {
        await delay(15000);
        try {
            const result = await injectionDetect(tc.input);
            if (result.isInjection) {
                truePositives++;
            } else {
                falseNegatives++;
                errors.push({ type: "missed", input: tc.input, confidence: result.confidence });
            }
            console.log(`  [+] "${tc.input.substring(0, 40)}..." => ${result.isInjection ? "CAUGHT" : "MISSED"}`);
        } catch (err) {
            console.log(`  [!] Error: ${tc.input.substring(0, 40)}...`);
            falseNegatives++;
        }
    }

    console.log("Running negative cases...");

    for (const tc of testCases.injection.negative) {
        await delay(2000);
        try {
            const result = await injectionDetect(tc.input);
            if (!result.isInjection) {
                trueNegatives++;
            } else {
                falsePositives++;
                errors.push({ type: "false_alarm", input: tc.input, confidence: result.confidence });
            }
            console.log(`  [-] "${tc.input.substring(0, 40)}..." => ${!result.isInjection ? "OK" : "FALSE ALARM"}`);
        } catch (err) {
            console.log(`  [!] Error: ${tc.input.substring(0, 40)}...`);
            trueNegatives++;
        }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    console.log(`\nTrue Positives:  ${truePositives}`);
    console.log(`False Negatives: ${falseNegatives}`);
    console.log(`True Negatives:  ${trueNegatives}`);
    console.log(`False Positives: ${falsePositives}`);
    console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`Recall:    ${(recall * 100).toFixed(1)}%`);
    console.log(`F1 Score:  ${(f1 * 100).toFixed(1)}%`);

    if (errors.length > 0) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach(e => {
            console.log(`  [${e.type}] "${e.input.substring(0, 50)}..." confidence: ${e.confidence}`);
        });
    }

    return { precision, recall, f1, truePositives, falseNegatives, trueNegatives, falsePositives };
}

module.exports = { evalInjection };

evalInjection().then(() => process.exit(0));