function LogDetail({ log, onClose }) {
    const piiData = typeof log.pii_detected === "string" ? JSON.parse(log.pii_detected) : log.pii_detected;

    return (
        <div className="detail-overlay">
            <div className="detail-panel">
                <button className="close-btn" onClick={onClose}>X</button>
                <h2>Log #{log.id}</h2>

                <h3>User Message</h3>
                <p>{log.user_message}</p>

                <h3>LLM Response</h3>
                <p>{log.llm_response}</p>

                <h3>PII Detected</h3>
                {piiData && piiData.length > 0 ? (
                    <ul>
                        {piiData.map((p, i) => (
                            <li key={i}>{p.type}: {p.value}</li>
                        ))}
                    </ul>
                ) : <p>None</p>}

                <h3>Prompt Injection</h3>
                <p>{log.prompt_injection_detected ? "Yes" : "No"}</p>

                <h3>Hallucination Score</h3>
                <p>{log.hallucination_score != null ? log.hallucination_score : "N/A"}</p>

                <h3>Flag Reason</h3>
                <p>{log.flag_reason || "None"}</p>

                <h3>Latency</h3>
                <p>{log.latency_ms}ms</p>
            </div>
        </div>
    );
}

export default LogDetail;