import { useState } from "react";
import axios from "axios";

const API = "http://localhost:3000";

function cleanMarkdown(text) {
    return text
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\|/g, ' ')
        .replace(/-{3,}/g, '')
        .replace(/<br>/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function ChatPanel({ onNewMessage }) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showFull, setShowFull] = useState(false);

    async function handleSend() {
        if (!message.trim() || loading) return;
        setLoading(true);
        setResult(null);
        setShowFull(false);
        try {
            const res = await axios.post(`${API}/chat`, { message });
            setResult(res.data);
            if (onNewMessage) onNewMessage();
        } catch (err) {
            setResult({ error: "Request failed" });
        }
        setLoading(false);
    }

    function verdictColor(verdict) {
        if (verdict === "supported") return "#6b8f71";
        if (verdict === "contradicted") return "#c9605a";
        return "#c4a24e";
    }

    const replyText = result && result.reply ? cleanMarkdown(result.reply) : "";
    const shortReply = replyText.length > 300 ? replyText.substring(0, 300) + "..." : replyText;

    return (
        <div className="chat-panel">
            <h2>Test a Message</h2>
            <div className="chat-input-row">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message to test..."
                    className="chat-input"
                />
                <button onClick={handleSend} disabled={loading} className="chat-send">
                    {loading ? "Checking..." : "Send"}
                </button>
            </div>

            {loading && <p className="chat-loading">Running guardrails checks — this may take 30-60 seconds...</p>}

            {result && !result.error && (
                <div className="chat-result">
                    <div className="chat-reply">
                        <h3>LLM Response</h3>
                        <p>{showFull ? replyText : shortReply}</p>
                        {replyText.length > 300 && (
                            <button className="show-more" onClick={() => setShowFull(!showFull)}>
                                {showFull ? "Show less" : "Show full response"}
                            </button>
                        )}
                    </div>

                    {result.grounding && result.grounding.overallScore !== undefined && (
                        <div className="chat-grounding">
                            <h3>
                                Grounding Score:{" "}
                                <span style={{ color: result.grounding.overallScore >= 0.7 ? "#6b8f71" : result.grounding.overallScore >= 0.4 ? "#c4a24e" : "#c9605a" }}>
                                    {(result.grounding.overallScore * 100).toFixed(0)}%
                                </span>
                            </h3>
                        </div>
                    )}

                    {result.grounding && result.grounding.claims && result.grounding.claims.length > 0 && (
                        <div className="claims-list">
                            {result.grounding.claims.map((c, i) => (
                                <div key={i} className="claim-card">
                                    <div className="claim-header">
                                        <span className="claim-verdict" style={{ background: verdictColor(c.verdict) }}>
                                            {c.verdict}
                                        </span>
                                        <span className="claim-score">{c.score}</span>
                                    </div>
                                    <p className="claim-text">{c.claim}</p>
                                    <p className="claim-reason">{c.reason}</p>
                                    {c.citation && c.citation !== "None" && (
                                        <p className="claim-citation">Source: {c.citation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {result.grounding && result.grounding.message && (
                        <p className="muted">{result.grounding.message}</p>
                    )}
                </div>
            )}

            {result && result.error && (
                <p className="chat-error">{result.error}</p>
            )}
        </div>
    );
}

export default ChatPanel;