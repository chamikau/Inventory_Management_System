import { useEffect, useState } from "react";
import api from "../services/api";

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        action: "",
        user_id: "",
        start_date: "",
        end_date: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = "/audit-logs?per_page=100";
            if (filters.action) url += `&action=${filters.action}`;
            if (filters.user_id) url += `&user_id=${filters.user_id}`;
            if (filters.start_date) url += `&start_date=${filters.start_date}`;
            if (filters.end_date) url += `&end_date=${filters.end_date}`;
            
            const response = await api.get(url);
            const logsData = response.data.data?.data || response.data.data || [];
            setLogs(logsData);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            setError("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/audit-logs/statistics");
            setStats(response.data.data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const handleExport = async () => {
        try {
            let url = "/audit-logs/export/csv";
            if (filters.start_date && filters.end_date) {
                url += `?start_date=${filters.start_date}&end_date=${filters.end_date}`;
            }
            window.open(`http://localhost:8000/api${url}`, '_blank');
        } catch (error) {
            console.error("Failed to export:", error);
        }
    };

    const handleResetFilters = () => {
        setFilters({
            action: "",
            user_id: "",
            start_date: "",
            end_date: ""
        });
    };

    const getActionIcon = (action) => {
        if (action.includes('created')) return '➕';
        if (action.includes('updated')) return '✏️';
        if (action.includes('deleted')) return '🗑️';
        if (action.includes('login')) return '🔐';
        if (action.includes('logout')) return '🚪';
        if (action.includes('borrowed')) return '📖';
        if (action.includes('returned')) return '🔄';
        if (action.includes('quantity')) return '🔢';
        if (action.includes('status')) return '🏷️';
        return '📝';
    };

    const getActionColor = (action) => {
        if (action.includes('created')) return '#2ecc71';
        if (action.includes('updated')) return '#3498db';
        if (action.includes('deleted')) return '#e74c3c';
        if (action.includes('login')) return '#9b59b6';
        if (action.includes('logout')) return '#e67e22';
        if (action.includes('borrowed')) return '#f39c12';
        if (action.includes('returned')) return '#1abc9c';
        return '#95a5a6';
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <div style={spinner}></div>
                <p>Loading audit logs...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={headerStyle}>
                <div>
                    <h1>Activity Logs</h1>
                    <p style={subtitle}>Track all system activities and user actions</p>
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            {stats && (
                <div style={statsGrid}>
                    <div style={{ ...statCard, backgroundColor: "#3498db" }}>
                        <div style={statIcon}>📊</div>
                        <div>
                            <div style={statValue}>{stats.total_logs}</div>
                            <div style={statLabel}>Total Activities</div>
                        </div>
                    </div>
                    <div style={{ ...statCard, backgroundColor: "#2ecc71" }}>
                        <div style={statIcon}>📅</div>
                        <div>
                            <div style={statValue}>{stats.today_logs}</div>
                            <div style={statLabel}>Today</div>
                        </div>
                    </div>
                    <div style={{ ...statCard, backgroundColor: "#e67e22" }}>
                        <div style={statIcon}>📆</div>
                        <div>
                            <div style={statValue}>{stats.this_week_logs}</div>
                            <div style={statLabel}>This Week</div>
                        </div>
                    </div>
                    <div style={{ ...statCard, backgroundColor: "#9b59b6" }}>
                        <div style={statIcon}>📈</div>
                        <div>
                            <div style={statValue}>{stats.this_month_logs}</div>
                            <div style={statLabel}>This Month</div>
                        </div>
                    </div>
                </div>
            )}

            {showFilters && (
                <div style={filtersContainer}>
                    <div style={filterRow}>
                        <div style={filterGroup}>
                            <label>Action</label>
                            <input
                                type="text"
                                placeholder="Filter by action..."
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                style={filterInput}
                            />
                        </div>
                        <div style={filterGroup}>
                            <label>User ID</label>
                            <input
                                type="number"
                                placeholder="User ID..."
                                value={filters.user_id}
                                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                                style={filterInput}
                            />
                        </div>
                        <div style={filterGroup}>
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                style={filterInput}
                            />
                        </div>
                        <div style={filterGroup}>
                            <label>End Date</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                style={filterInput}
                            />
                        </div>
                        <div style={filterButtons}>
                            <button onClick={handleResetFilters} style={resetButton}>Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {stats?.top_actions && stats.top_actions.length > 0 && (
                <div style={topActionsContainer}>
                    <h3>Top Actions</h3>
                    <div style={topActionsGrid}>
                        {stats.top_actions.map((action, index) => (
                            <div key={index} style={topActionItem}>
                                <span>{getActionIcon(action.action)} {action.action}</span>
                                <span style={topActionCount}>{action.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {logs.length === 0 ? (
                <div style={emptyState}>
                    <span style={emptyIcon}>📋</span>
                    <p>No activity logs found.</p>
                </div>
            ) : (
                <div style={tableContainer}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={tableRow}>
                                    <td style={tdStyle}>
                                        <div style={dateTime}>
                                            {new Date(log.created_at).toLocaleDateString()}
                                            <span style={timeStyle}>
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <strong>{log.user?.name || 'System'}</strong>
                                        <div style={userIdStyle}>ID: {log.user?.id || 'N/A'}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            backgroundColor: getActionColor(log.action),
                                            color: "white",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "11px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}>
                                            {getActionIcon(log.action)} {log.readable_action || log.action}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div>{log.entity_type_name}</div>
                                        {log.entity_id && (
                                            <div style={entityIdStyle}>ID: {log.entity_id}</div>
                                        )}
                                    </td>
                                    <td style={tdStyle}>
                                        <code style={ipStyle}>{log.ip_address || 'N/A'}</code>
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            onClick={() => setSelectedLog(log)} 
                                            style={viewButton}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedLog && (
                <Modal onClose={() => setSelectedLog(null)}>
                    <h2 style={modalTitle}>Activity Details</h2>
                    
                    <div style={detailSection}>
                        <div style={detailRow}>
                            <span style={detailLabel}>Time:</span>
                            <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
                        </div>
                        <div style={detailRow}>
                            <span style={detailLabel}>User:</span>
                            <span>{selectedLog.user?.name} (ID: {selectedLog.user?.id})</span>
                        </div>
                        <div style={detailRow}>
                            <span style={detailLabel}>Action:</span>
                            <span>
                                <span style={{
                                    backgroundColor: getActionColor(selectedLog.action),
                                    color: "white",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "12px"
                                }}>
                                    {selectedLog.readable_action || selectedLog.action}
                                </span>
                            </span>
                        </div>
                        <div style={detailRow}>
                            <span style={detailLabel}>Entity:</span>
                            <span>{selectedLog.entity_type_name} (ID: {selectedLog.entity_id})</span>
                        </div>
                        <div style={detailRow}>
                            <span style={detailLabel}>IP Address:</span>
                            <span><code>{selectedLog.ip_address || 'N/A'}</code></span>
                        </div>
                        <div style={detailRow}>
                            <span style={detailLabel}>User Agent:</span>
                            <span style={userAgentStyle}>{selectedLog.user_agent || 'N/A'}</span>
                        </div>
                    </div>

                    {selectedLog.old_value && (
                        <div style={detailSection}>
                            <h4>Previous Values</h4>
                            <pre style={jsonViewer}>{JSON.stringify(selectedLog.old_value, null, 2)}</pre>
                        </div>
                    )}

                    {selectedLog.new_value && (
                        <div style={detailSection}>
                            <h4>New Values</h4>
                            <pre style={jsonViewer}>{JSON.stringify(selectedLog.new_value, null, 2)}</pre>
                        </div>
                    )}

                    <button onClick={() => setSelectedLog(null)} style={closeButton}>Close</button>
                </Modal>
            )}
        </div>
    );
}

function Modal({ children, onClose }) {
    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "15px",
};

const subtitle = {
    color: "#666",
    marginTop: "5px",
    fontSize: "14px",
};

const headerButtons = {
    display: "flex",
    gap: "10px",
};

const filterButton = {
    padding: "10px 20px",
    backgroundColor: "#ecf0f1",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

const exportButton = {
    padding: "10px 20px",
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

const statsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
};

const statCard = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    borderRadius: "10px",
    color: "white",
};

const statIcon = { fontSize: "32px" };
const statValue = { fontSize: "24px", fontWeight: "bold" };
const statLabel = { fontSize: "12px", opacity: 0.9 };

const filtersContainer = {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
};

const filterRow = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    alignItems: "end",
};

const filterGroup = {
    display: "flex",
    flexDirection: "column",
};

const filterInput = {
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    marginTop: "5px",
};

const resetButton = {
    padding: "8px 20px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
};

const topActionsContainer = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #e0e0e0",
};

const topActionsGrid = {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginTop: "15px",
};

const topActionItem = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "20px",
    minWidth: "150px",
};

const topActionCount = {
    fontWeight: "bold",
    color: "#3498db",
};

const tableContainer = {
    overflowX: "auto",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
};

const tableRow = {
    borderBottom: "1px solid #eee",
};

const tdStyle = {
    padding: "12px",
    verticalAlign: "top",
};

const dateTime = {
    fontSize: "13px",
};

const timeStyle = {
    fontSize: "11px",
    color: "#666",
    display: "block",
};

const userIdStyle = {
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
};

const entityIdStyle = {
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
};

const ipStyle = {
    fontSize: "12px",
    backgroundColor: "#f8f9fa",
    padding: "2px 4px",
    borderRadius: "3px",
};

const viewButton = {
    padding: "5px 10px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
};

const loadingStyle = {
    textAlign: "center",
    padding: "50px",
};

const spinner = {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 10px",
};

const errorStyle = {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "12px",
    borderRadius: "5px",
    marginBottom: "20px",
};

const emptyState = {
    textAlign: "center",
    padding: "60px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    color: "#666",
};

const emptyIcon = {
    fontSize: "48px",
    display: "block",
    marginBottom: "15px",
};

const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
};

const modalContent = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "600px",
    maxWidth: "90%",
    maxHeight: "90%",
    overflowY: "auto",
};

const modalTitle = {
    marginBottom: "20px",
};

const detailSection = {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
};

const detailRow = {
    display: "flex",
    marginBottom: "10px",
};

const detailLabel = {
    width: "120px",
    fontWeight: "bold",
    color: "#555",
};

const userAgentStyle = {
    fontSize: "11px",
    wordBreak: "break-all",
};

const jsonViewer = {
    backgroundColor: "#2c3e50",
    color: "#ecf0f1",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "12px",
    overflowX: "auto",
    maxHeight: "200px",
};

const closeButton = {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
};

const globalStyles = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;