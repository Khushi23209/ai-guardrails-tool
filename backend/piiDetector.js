function detectPII(text){
        const patterns = [
        { type: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
        { type: "phone", pattern: /(?:\+?91[\s-]?)?[6-9]\d{9}/g },
        { type: "credit_card", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4}\b/g },
        { type: "aadhaar", pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g }
    ];
    const results =[];
    for(const p of patterns){
         const matches = text.matchAll(p.pattern);
         for (const match of matches) {
             results.push({ type: p.type, value: match[0] });
         }
    }
    return results;
}
module.exports = { detectPII };
