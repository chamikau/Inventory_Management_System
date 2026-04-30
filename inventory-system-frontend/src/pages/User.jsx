// pages/Users.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function Users() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff"
  });
  const [error, setError] = useState("");

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.data.data || res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${editingUser.id}`, updateData);
      } else {
        // Create user
        await api.post("/users", formData);
      }
      
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own account!");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "staff"
    });
    setShowModal(false);
    setError("");
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>User Management</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          + Create New User
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "10px", padding: "10px", backgroundColor: "#fee", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Created By</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Created At</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px" }}>{user.name}</td>
                  <td style={{ padding: "12px" }}>{user.email}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: user.role === "admin" ? "#e74c3c" : "#3498db",
                        color: "white"
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{user.creator?.name || "System"}</td>
                  <td style={{ padding: "12px" }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        marginRight: "8px",
                        padding: "5px 10px",
                        backgroundColor: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={user.id === currentUser?.id}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: user.id === currentUser?.id ? "#95a5a6" : "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: user.id === currentUser?.id ? "not-allowed" : "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <p style={{ textAlign: "center", marginTop: "20px" }}>No users found. Create your first user!</p>
          )}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "500px",
              maxWidth: "90%"
            }}
          >
            <h2>{editingUser ? "Edit User" : "Create New User"}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  {editingUser ? "Password (leave blank to keep current)" : "Password *"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {editingUser ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#95a5a6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}