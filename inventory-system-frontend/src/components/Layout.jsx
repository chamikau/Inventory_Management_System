import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await api.get("/me");
          setUser(res.data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isAdmin = user?.role === "admin";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{
        width: "250px",
        backgroundColor: "#2c3e50",
        color: "white",
        padding: "20px",
        position: "fixed",
        height: "100vh",
        overflowY: "auto"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          📦 Inventory MS
        </h2>
        <hr />
        
        <nav>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/dashboard" style={linkStyle}>📊 Dashboard</Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/cupboards" style={linkStyle}>🗄️ Cupboards</Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/places" style={linkStyle}>📍 Places</Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/items" style={linkStyle}>📦 Items</Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/borrowings" style={linkStyle}>📋 Borrowings</Link>
            </li>
            
            {isAdmin && (
              <>
                <li style={{ marginBottom: "10px" }}>
                  <Link to="/users" style={linkStyle}>👥 Users</Link>
                </li>
                <li style={{ marginBottom: "10px" }}>
                  <Link to="/audit-logs" style={linkStyle}>📜 Audit Logs</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        
        <hr />
        
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "14px" }}>Logged in as:</p>
          <p style={{ fontWeight: "bold" }}>{user?.name}</p>
          <p style={{ fontSize: "12px", color: "#bdc3c7" }}>Role: {user?.role}</p>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
      
      <div style={{
        marginLeft: "250px",
        padding: "20px",
        flex: 1,
        backgroundColor: "#f5f5f5",
        minHeight: "100vh"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          minHeight: "calc(100vh - 40px)"
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  display: "block",
  padding: "8px 10px",
  borderRadius: "4px",
  transition: "background-color 0.3s"
};