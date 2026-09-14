function StatsBar({ stats }) {
    if (!stats) return <p>Loading stats...</p>;

    return (
        <div className="stats-bar">
            <div className="stat-card">
                <h3>{stats.total_requests}</h3>
                <p>Total Requests</p>
            </div>
            <div className="stat-card">
                <h3>{stats.flagged_count}</h3>
                <p>Flagged</p>
            </div>
            <div className="stat-card">
                <h3>{stats.injection_count}</h3>
                <p>Injections</p>
            </div>
            <div className="stat-card">
                <h3>{stats.avg_latency}ms</h3>
                <p>Avg Latency</p>
            </div>
            <div className="stat-card">
                <h3>{stats.avg_grounding_score}</h3>
                <p>Avg Grounding</p>
            </div>
        </div>
    );
}

export default StatsBar;