import { useEffect, useState } from "react";
import api from "../services/api";

function Modal({ children, onClose }) {
    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export default function Users() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "staff" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get("/users");
            console.log("API Response:", response.data); 
            
            let usersData = [];
            if (response.data && response.data.data) {
                if (response.data.data.data) {
                    usersData = response.data.data.data;
                } else if (Array.isArray(response.data.data)) {
                    usersData = response.data.data;
                } else {
                    usersData = [];
                }
            } else if (Array.isArray(response.data)) {
                usersData = response.data;
            }
            
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setError(error.response?.data?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            await api.post("/users", formData);
            setShowModal(false);
            setFormData({ name: "", email: "", password: "", role: "staff" });
            fetchUsers();
        } catch (error) {
            console.error("Failed to create user:", error);
            setError(error.response?.data?.message || "Failed to create user");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
            setError(error.response?.data?.message || "Failed to delete user");
        }
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <p>Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={errorContainer}>
                <p style={errorText}>{error}</p>
                <button onClick={fetchUsers} style={retryButton}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div style={headerStyle}>
                <h1>Users</h1>
                <button onClick={() => setShowModal(true)} style={primaryButton}>
                    + Add User
                </button>
            </div>

            {users.length === 0 ? (
                <div style={emptyState}>
                    <p>No users found. Click "Add User" to create one.</p>
                </div>
            ) : (
                <div style={tableContainer}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created By</th>
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
                                            {user.role === "admin" ? "Admin" : "Staff"}
                                        </span>
                                    </td>
                                    <td>{user.creator?.name || "System"}</td>
                                    <td>
                                        <button 
                                            onClick={() => handleDelete(user.id)} 
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
            )}

            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <h2>Add User</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={formGroup}>
                            <label>Name *</label>
                            <input
                                type="text"
                                placeholder="Enter name"
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
                                placeholder="Enter email"
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
                                placeholder="Enter password"
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
                </Modal>
            )}
        </div>
    );
}

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
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
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
};

const staffBadge = {
    backgroundColor: "#3498db",
    color: "white",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
};

const deleteButton = {
    padding: "5px 12px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
};

const primaryButton = {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
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

const errorContainer = {
    textAlign: "center",
    padding: "50px",
};

const errorText = {
    color: "#e74c3c",
    marginBottom: "15px",
};

const retryButton = {
    padding: "8px 16px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
};

const emptyState = {
    textAlign: "center",
    padding: "50px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    color: "#666",
};

const formGroup = {
    marginBottom: "15px",
};

const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
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
    maxHeight: "90%",
    overflowY: "auto",
};

const modalTitle = {
    marginBottom: "20px",
};