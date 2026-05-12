// pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import api from "../services/api";

export default function Dashboard() {
    const { user } = useUser();
    const [stats, setStats] = useState({
        total_items: 0,
        total_cupboards: 0,
        total_places: 0,
        active_borrowings: 0,
        items_by_status: { in_store: 0, borrowed: 0, damaged: 0, missing: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get("/dashboard/stats");
            setStats(response.data.data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div>
            <div style={{ marginBottom: "30px" }}>
                <h1>Welcome back, {user?.name}! 👋</h1>
                <p>Here's what's happening with your inventory today.</p>
            </div>

            <div style={statsGrid}>
                <div style={{ ...statCard, backgroundColor: "#3498db" }}>
                    <div style={statIcon}>📦</div>
                    <div>
                        <div style={statValue}>{stats.total_items}</div>
                        <div style={statLabel}>Total Items</div>
                    </div>
                </div>

                <div style={{ ...statCard, backgroundColor: "#2ecc71" }}>
                    <div style={statIcon}>🗄️</div>
                    <div>
                        <div style={statValue}>{stats.total_cupboards}</div>
                        <div style={statLabel}>Cupboards</div>
                    </div>
                </div>

                <div style={{ ...statCard, backgroundColor: "#e67e22" }}>
                    <div style={statIcon}>📍</div>
                    <div>
                        <div style={statValue}>{stats.total_places}</div>
                        <div style={statLabel}>Places</div>
                    </div>
                </div>

                <div style={{ ...statCard, backgroundColor: "#e74c3c" }}>
                    <div style={statIcon}>📋</div>
                    <div>
                        <div style={statValue}>{stats.active_borrowings}</div>
                        <div style={statLabel}>Active Borrowings</div>
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3>Item Status Distribution</h3>
                <div style={statusGrid}>
                    <div style={statusItem}>
                        <span>✅ In Store</span>
                        <strong>{stats.items_by_status?.in_store || 0}</strong>
                    </div>
                    <div style={statusItem}>
                        <span>📖 Borrowed</span>
                        <strong>{stats.items_by_status?.borrowed || 0}</strong>
                    </div>
                    <div style={statusItem}>
                        <span>⚠️ Damaged</span>
                        <strong>{stats.items_by_status?.damaged || 0}</strong>
                    </div>
                    <div style={statusItem}>
                        <span>❓ Missing</span>
                        <strong>{stats.items_by_status?.missing || 0}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

const statsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
};

const statCard = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    borderRadius: "10px",
    color: "white"
};

const statIcon = { fontSize: "40px" };
const statValue = { fontSize: "28px", fontWeight: "bold" };
const statLabel = { fontSize: "14px", opacity: 0.9 };

const sectionStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #eee"
};

const statusGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
    marginTop: "15px"
};

const statusItem = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "5px"
};