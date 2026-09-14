function LogsTable({ logs, onSelect }) {
    if (logs.length === 0) return <p>No logs found.</p>;

    return (
        <table className="logs-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Time</th>
                    <th>Message</th>
                    <th>Flagged</th>
                    <th>Reason</th>
                    <th>Hallucination</th>
                    <th>Latency</th>
                </tr>
            </thead>
            <tbody>
                {logs.map(log => (
                    <tr key={log.id} onClick={() => onSelect(log)} className={log.flagged ? "flagged-row" : ""}>
                        <td>{log.id}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>{log.user_message.substring(0, 50)}...</td>
                        <td>{log.flagged ? "Yes" : "No"}</td>
                        <td>{log.flag_reason || "-"}</td>
                        <td>{log.hallucination_score != null ? log.hallucination_score.toFixed(2) : "-"}</td>
                        <td>{log.latency_ms}ms</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default LogsTable;