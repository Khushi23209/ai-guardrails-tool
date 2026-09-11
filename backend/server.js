require('dotenv').config();
const cors = require("cors");
const pool = require('./db');
const { getChatResponse } = require("./llmService");
const { preCheck, postCheck } = require('./middleware');
const express = require("express");
const app = express();
app.use(cors());
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
       
        const groundingResult = postCheckmsg.groundingResult;
        const hasHallucination = groundingResult.overallScore < 0.5;
         const flagged = hasPII || hasInjection || hasHallucination;

        const reasons = [];
        if (hasPII) reasons.push("PII detected");
        if (hasInjection) reasons.push("Prompt injection detected");
        if (hasHallucination) reasons.push("Possible hallucination");
        const flagReason = reasons.length > 0 ? reasons.join(", ") : null;
 
        const latency = Date.now() - startTime;
       await pool.query(
            `INSERT INTO logs (user_message, llm_response, pii_detected, prompt_injection_detected, hallucination_score, flagged, flag_reason, latency_ms)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [message, postCheckmsg.message, JSON.stringify(allPiiFindings), hasInjection, groundingResult.overallScore, flagged, flagReason, latency]
        );
       res.json({ 
        reply: postCheckmsg.message,
        grounding: groundingResult
    });
    }catch(error){
        console.error(error);
       res.status(500).json({ error: "Something went wrong" });
        
    }
    
})

app.get("/api/logs", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM logs ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

app.get("/api/logs/flagged", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM logs WHERE flagged = true ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch flagged logs" });
    }
});
app.get("/api/stats", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE flagged = true) as flagged_count,
                COUNT(*) FILTER (WHERE prompt_injection_detected = true) as injection_count,
                ROUND(AVG(latency_ms)) as avg_latency,
                ROUND(AVG(hallucination_score)::numeric, 2) as avg_grounding_score
            FROM logs
        `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});