const { detectPII } = require("../backend/piiDetector");
const testCases = require("./test-cases.json");

function evalPII() {
    let truePositives = 0;
    let falseNegatives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    const errors = [];

    
    for (const tc of testCases.pii.positive) {
        const results = detectPII(tc.input);
        const detectedTypes = results.map(r => r.type);

        let allFound = true;
        for (const expected of tc.expected_types) {
            if (detectedTypes.includes(expected)) {
                truePositives++;
            } else {
                falseNegatives++;
                allFound = false;
            }
        }
        if (!allFound) {
            errors.push({ type: "missed", input: tc.input, expected: tc.expected_types, got: detectedTypes });
        }
    }

    
    for (const tc of testCases.pii.negative) {
        const results = detectPII(tc.input);
        if (results.length === 0) {
            trueNegatives++;
        } else {
            falsePositives++;
            errors.push({ type: "false_alarm", input: tc.input, got: results.map(r => r.type) });
        }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    console.log("\n=== PII Detection Eval ===");
    console.log(`True Positives:  ${truePositives}`);
    console.log(`False Negatives: ${falseNegatives}`);
    console.log(`True Negatives:  ${trueNegatives}`);
    console.log(`False Positives: ${falsePositives}`);
    console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`Recall:    ${(recall * 100).toFixed(1)}%`);
    console.log(`F1 Score:  ${(f1 * 100).toFixed(1)}%`);

    if (errors.length > 0) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach(e => {
            console.log(`  [${e.type}] "${e.input.substring(0, 50)}..." expected: ${JSON.stringify(e.expected || "none")} got: ${JSON.stringify(e.got)}`);
        });
    }

    return { precision, recall, f1, truePositives, falseNegatives, trueNegatives, falsePositives };
}

module.exports = { evalPII };


evalPII();