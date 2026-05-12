// pages/Cupboards.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Cupboards() {
    const [cupboards, setCupboards] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: "", location: "", description: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCupboards();
    }, []);

    const fetchCupboards = async () => {
        try {
            const response = await api.get("/cupboards");
            setCupboards(response.data.data || response.data);
        } catch (error) {
            console.error("Failed to fetch cupboards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/cupboards/${editing.id}`, formData);
            } else {
                await api.post("/cupboards", formData);
            }
            setShowModal(false);
            setEditing(null);
            setFormData({ name: "", location: "", description: "" });
            fetchCupboards();
        } catch (error) {
            console.error("Failed to save cupboard:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/cupboards/${id}`);
            fetchCupboards();
        } catch (error) {
            console.error("Failed to delete cupboard:", error);
        }
    };

    const handleEdit = (cupboard) => {
        setEditing(cupboard);
        setFormData({
            name: cupboard.name,
            location: cupboard.location || "",
            description: cupboard.description || ""
        });
        setShowModal(true);
    };

    if (loading) return <div>Loading cupboards...</div>;

    return (
        <div>
            <div style={headerStyle}>
                <h1>Cupboards</h1>
                <button onClick={() => setShowModal(true)} style={primaryButton}>
                    + Add Cupboard
                </button>
            </div>

            <div style={gridStyle}>
                {cupboards.map((cupboard) => (
                    <div key={cupboard.id} style={cardStyle}>
                        <div style={cardHeader}>
                            <span style={cardIcon}>🗄️</span>
                            <div>
                                <button onClick={() => handleEdit(cupboard)} style={editButton}>✏️</button>
                                <button onClick={() => handleDelete(cupboard.id)} style={deleteButton}>🗑️</button>
                            </div>
                        </div>
                        <h3>{cupboard.name}</h3>
                        {cupboard.location && <p>📍 {cupboard.location}</p>}
                        {cupboard.description && <p>{cupboard.description}</p>}
                        <div style={cardFooter}>
                            <span>📦 {cupboard.places?.length || 0} places</span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <Modal onClose={() => { setShowModal(false); setEditing(null); }}>
                    <h2>{editing ? "Edit Cupboard" : "Add Cupboard"}</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Cupboard Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={inputStyle}
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            style={inputStyle}
                        />
                        <textarea
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{ ...inputStyle, minHeight: "80px" }}
                        />
                        <div style={modalButtons}>
                            <button type="submit" style={primaryButton}>Save</button>
                            <button type="button" onClick={() => setShowModal(false)} style={secondaryButton}>Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// Modal Component
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
    marginBottom: "20px"
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px"
};

const cardStyle = {
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "15px",
    transition: "box-shadow 0.3s"
};

const cardHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
};

const cardIcon = { fontSize: "30px" };
const cardFooter = { marginTop: "10px", fontSize: "12px", color: "#666" };

const editButton = {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    marginRight: "5px"
};

const deleteButton = {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#e74c3c"
};

const primaryButton = {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
};

const secondaryButton = {
    padding: "10px 20px",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
};

const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px"
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
    zIndex: 1000
};

const modalContent = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "500px",
    maxWidth: "90%"
};

const modalButtons = {
    display: "flex",
    gap: "10px",
    marginTop: "10px"
};