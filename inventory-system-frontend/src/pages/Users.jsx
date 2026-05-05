// pages/Users.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.data.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("/users", formData);
      setSuccess("User created successfully!");
      setShowModal(false);
      setFormData({ name: "", email: "", password: "", role: "staff" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <div style={headerStyle}>
        <h1>User Management</h1>
        <button onClick={() => setShowModal(true)} style={createButton}>
          + Create New User
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span style={user.role === "admin" ? adminBadge : staffBadge}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td>{user.creator?.name || "System"}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    style={deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2>Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div style={formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={formGroup}>
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={formGroup}>
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={modalButtons}>
                <button type="submit" style={submitButton}>Create</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelButton}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const createButton = {
  padding: "10px 20px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
};

const tableContainer = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};

const adminBadge = {
  backgroundColor: "#e74c3c",
  color: "white",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "bold",
};

const staffBadge = {
  backgroundColor: "#3498db",
  color: "white",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "bold",
};

const deleteButton = {
  padding: "5px 10px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const errorStyle = {
  backgroundColor: "#f8d7da",
  color: "#721c24",
  padding: "10px",
  borderRadius: "4px",
  marginBottom: "10px",
};

const successStyle = {
  backgroundColor: "#d4edda",
  color: "#155724",
  padding: "10px",
  borderRadius: "4px",
  marginBottom: "10px",
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
  borderRadius: "8px",
  width: "500px",
  maxWidth: "90%",
};

const formGroup = {
  marginBottom: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  marginTop: "5px",
};

const modalButtons = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const submitButton = {
  flex: 1,
  padding: "10px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const cancelButton = {
  flex: 1,
  padding: "10px",
  backgroundColor: "#95a5a6",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};