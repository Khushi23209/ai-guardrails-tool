require('dotenv').config();
const pool = require('./db');
const { getChatResponse } = require("./llmService");
const { preCheck, postCheck } = require('./middleware');
const express = require("express");
const app = express();
app.use(express.json())
const port = process.env.PORT || 3000

app.post("/chat",async (req,res)=>{
    const startTime = Date.now();
    try{
        const message= req.body.message;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        const precheckmsg = await preCheck(message);
        const llmres = await getChatResponse(precheckmsg.message);
        const injectionResult = precheckmsg.injectionResult;
        const postCheckmsg = await postCheck(llmres);
        const allPiiFindings = [...precheckmsg.ppiFindings, ...postCheckmsg.ppiFindings];
        const hasPII = allPiiFindings.length > 0;
        const hasInjection = injectionResult.isInjection === true;
        const flagged = hasPII || hasInjection;

        const reasons = [];
        if (hasPII) reasons.push("PII detected");
        if (hasInjection) reasons.push("Prompt injection detected");
        const flagReason = reasons.length > 0 ? reasons.join(", ") : null;
        const latency = Date.now() - startTime;
        await pool.query(
            `INSERT INTO logs (user_message, llm_response, pii_detected, prompt_injection_detected, flagged, flag_reason, latency_ms)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [message, postCheckmsg.message, JSON.stringify(allPiiFindings), hasInjection, flagged, flagReason, latency]
        );
        res.json({ reply: postCheckmsg.message });
    }catch(error){
        console.error(error);
       res.status(500).json({ error: "Something went wrong" });
        
    }
    
})
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});