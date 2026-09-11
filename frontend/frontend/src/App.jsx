import { useState, useEffect } from "react";
import axios from "axios";
import StatsBar from "./components/StatsBar";
import LogsTable from "./components/LogsTable";
import LogDetail from "./components/LogDetail";
import "./App.css";

const API = "http://localhost:3000";

function App() {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        fetchData();
    }, [filter]);

    async function fetchData() {
        try {
            const statsRes = await axios.get(`${API}/api/stats`);
            setStats(statsRes.data);

            const logsUrl = filter === "flagged" ? `${API}/api/logs/flagged` : `${API}/api/logs`;
            const logsRes = await axios.get(logsUrl);
            setLogs(logsRes.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    }

    const filteredLogs = logs
        .filter(log => {
            if (filter === "pii") return log.pii_detected && JSON.parse(log.pii_detected).length > 0;
            if (filter === "injection") return log.prompt_injection_detected;
            if (filter === "hallucination") return log.hallucination_score !== null && log.hallucination_score < 0.5;
            return true;
        })
        .filter(log => {
            if (!search) return true;
            return log.user_message.toLowerCase().includes(search.toLowerCase());
        })
        .sort((a, b) => {
            if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === "latency") return b.latency_ms - a.latency_ms;
            if (sortBy === "grounding") return (a.hallucination_score ?? 1) - (b.hallucination_score ?? 1);
            return 0;
        });

    return (
        <div className="app">
            <h1>AI Guardrails Dashboard</h1>
            <StatsBar stats={stats} />
            <div className="controls">
                <div className="filter-bar">
                    <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
                    <button onClick={() => setFilter("flagged")} className={filter === "flagged" ? "active" : ""}>Flagged</button>
                    <button onClick={() => setFilter("pii")} className={filter === "pii" ? "active" : ""}>PII</button>
                    <button onClick={() => setFilter("injection")} className={filter === "injection" ? "active" : ""}>Injection</button>
                    <button onClick={() => setFilter("hallucination")} className={filter === "hallucination" ? "active" : ""}>Hallucination</button>
                </div>
                <div className="search-sort">
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="latency">Highest latency</option>
                        <option value="grounding">Lowest grounding</option>
                    </select>
                </div>
            </div>
            <LogsTable logs={filteredLogs} onSelect={setSelectedLog} />
            {selectedLog && <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}

export default App;