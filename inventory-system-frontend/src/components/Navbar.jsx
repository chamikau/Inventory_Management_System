// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (logout) logout();
    navigate("/");
  };

  const isAdmin = user?.role === "admin";

  return (
    <div style={{
      width: "250px",
      backgroundColor: "#2c3e50",
      color: "white",
      position: "fixed",
      height: "100vh",
      padding: "20px"
    }}>
      <h3>Inventory System</h3>
      <hr />
      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "10px" }}>
            <Link to="/dashboard" style={{ color: "white", textDecoration: "none" }}>
              Dashboard
            </Link>
          </li>
          <li style={{ marginBottom: "10px" }}>
            <Link to="/cupboards" style={{ color: "white", textDecoration: "none" }}>
              Cupboards
            </Link>
          </li>
          <li style={{ marginBottom: "10px" }}>
            <Link to="/places" style={{ color: "white", textDecoration: "none" }}>
              Places
            </Link>
          </li>
          <li style={{ marginBottom: "10px" }}>
            <Link to="/items" style={{ color: "white", textDecoration: "none" }}>
              Items
            </Link>
          </li>
          <li style={{ marginBottom: "10px" }}>
            <Link to="/borrowings" style={{ color: "white", textDecoration: "none" }}>
              Borrowings
            </Link>
          </li>
          
          {isAdmin && (
            <>
              <li style={{ marginBottom: "10px" }}>
                <Link to="/users" style={{ color: "white", textDecoration: "none" }}>
                  Users
                </Link>
              </li>
              <li style={{ marginBottom: "10px" }}>
                <Link to="/audit-logs" style={{ color: "white", textDecoration: "none" }}>
                  Audit Logs
                </Link>
              </li>
            </>
          )}
        </ul>
        
        <hr />
        
        <div style={{ marginTop: "20px" }}>
          <p>Logged in as: <strong>{user?.name}</strong></p>
          <p style={{ fontSize: "12px" }}>Role: {user?.role}</p>
          <button 
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}