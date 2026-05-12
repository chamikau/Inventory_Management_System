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

export default function Places() {
    const [places, setPlaces] = useState([]);
    const [cupboards, setCupboards] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        cupboard_id: "",
        shelf_number: "",
        description: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPlaces();
        fetchCupboards();
    }, []);

    const fetchPlaces = async () => {
        setLoading(true);
        try {
            const response = await api.get("/places");
            console.log("Places API Response:", response.data);
            
            let placesData = [];
            if (response.data && response.data.data) {
                placesData = response.data.data.data || response.data.data;
            } else if (Array.isArray(response.data)) {
                placesData = response.data;
            }
            
            setPlaces(placesData);
        } catch (error) {
            console.error("Failed to fetch places:", error);
            setError(error.response?.data?.message || "Failed to load places");
        } finally {
            setLoading(false);
        }
    };

    const fetchCupboards = async () => {
        try {
            const response = await api.get("/cupboards");
            let cupboardsData = [];
            if (response.data && response.data.data) {
                cupboardsData = response.data.data.data || response.data.data;
            } else if (Array.isArray(response.data)) {
                cupboardsData = response.data;
            }
            setCupboards(cupboardsData);
        } catch (error) {
            console.error("Failed to fetch cupboards:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            if (editing) {
                await api.put(`/places/${editing.id}`, formData);
            } else {
                await api.post("/places", formData);
            }
            setShowModal(false);
            setEditing(null);
            setFormData({ name: "", cupboard_id: "", shelf_number: "", description: "" });
            fetchPlaces();
        } catch (error) {
            console.error("Failed to save place:", error);
            setError(error.response?.data?.message || "Failed to save place");
        }
    };

    const handleEdit = (place) => {
        setEditing(place);
        setFormData({
            name: place.name,
            cupboard_id: place.cupboard_id,
            shelf_number: place.shelf_number || "",
            description: place.description || ""
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this place? This will also delete all items inside it.")) return;
        
        try {
            await api.delete(`/places/${id}`);
            fetchPlaces();
        } catch (error) {
            console.error("Failed to delete place:", error);
            setError(error.response?.data?.message || "Failed to delete place");
        }
    };

    const getCupboardName = (cupboardId) => {
        const cupboard = cupboards.find(c => c.id === cupboardId);
        return cupboard ? cupboard.name : "Unknown Cupboard";
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <p>Loading places...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={headerStyle}>
                <div>
                    <h1>Storage Places</h1>
                    <p style={subtitle}>Manage storage locations inside cupboards</p>
                </div>
                <button onClick={() => setShowModal(true)} style={primaryButton}>
                    + Add Place
                </button>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            {places.length === 0 ? (
                <div style={emptyState}>
                    <span style={emptyIcon}>📍</span>
                    <p>No places found. Click "Add Place" to create your first storage location.</p>
                </div>
            ) : (
                <div style={gridStyle}>
                    {places.map((place) => (
                        <div key={place.id} style={cardStyle}>
                            <div style={cardHeader}>
                                <div style={cardIcon}>📍</div>
                                <div>
                                    <button onClick={() => handleEdit(place)} style={editButton} title="Edit">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(place.id)} style={deleteButton} title="Delete">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            
                            <h3 style={placeName}>{place.name}</h3>
                            
                            {place.shelf_number && (
                                <div style={infoRow}>
                                    <span style={infoLabel}>Shelf:</span>
                                    <span style={infoValue}>{place.shelf_number}</span>
                                </div>
                            )}
                            
                            <div style={infoRow}>
                                <span style={infoLabel}>Cupboard:</span>
                                <span style={infoValue}>{getCupboardName(place.cupboard_id)}</span>
                            </div>
                            
                            {place.description && (
                                <p style={description}>{place.description}</p>
                            )}
                            
                            <div style={cardFooter}>
                                <span>📦 {place.items?.length || 0} items</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Create/Edit Place */}
            {showModal && (
                <Modal onClose={() => {
                    setShowModal(false);
                    setEditing(null);
                    setFormData({ name: "", cupboard_id: "", shelf_number: "", description: "" });
                }}>
                    <h2 style={modalTitle}>{editing ? "Edit Place" : "Add New Place"}</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={formGroup}>
                            <label style={labelStyle}>Place Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Shelf A, Drawer 1, Top Rack"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Cupboard *</label>
                            <select
                                value={formData.cupboard_id}
                                onChange={(e) => setFormData({ ...formData, cupboard_id: e.target.value })}
                                required
                                style={inputStyle}
                            >
                                <option value="">Select a cupboard</option>
                                {cupboards.map((cupboard) => (
                                    <option key={cupboard.id} value={cupboard.id}>
                                        {cupboard.name} {cupboard.location ? `(${cupboard.location})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Shelf Number</label>
                            <input
                                type="text"
                                placeholder="e.g., A-01, Row 2, Section B"
                                value={formData.shelf_number}
                                onChange={(e) => setFormData({ ...formData, shelf_number: e.target.value })}
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                placeholder="Optional description of this storage place"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                style={textareaStyle}
                            />
                        </div>

                        <div style={modalButtons}>
                            <button type="submit" style={submitButton}>
                                {editing ? "Update Place" : "Create Place"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setShowModal(false);
                                    setEditing(null);
                                    setFormData({ name: "", cupboard_id: "", shelf_number: "", description: "" });
                                }} 
                                style={cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// Styles
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

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
};

const cardStyle = {
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    padding: "20px",
    transition: "all 0.3s ease",
    cursor: "pointer",
};

const cardHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
};

const cardIcon = {
    fontSize: "32px",
};

const placeName = {
    margin: "0 0 15px 0",
    fontSize: "18px",
    color: "#2c3e50",
};

const infoRow = {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    fontSize: "14px",
};

const infoLabel = {
    width: "80px",
    color: "#666",
    fontWeight: "500",
};

const infoValue = {
    color: "#333",
    flex: 1,
};

const description = {
    color: "#666",
    fontSize: "13px",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
};

const cardFooter = {
    marginTop: "15px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
    fontSize: "12px",
    color: "#666",
};

const editButton = {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    marginRight: "8px",
    padding: "5px",
};

const deleteButton = {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#e74c3c",
    padding: "5px",
};

const primaryButton = {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
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
    padding: "12px 15px",
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
    width: "550px",
    maxWidth: "90%",
    maxHeight: "90%",
    overflowY: "auto",
};

const modalTitle = {
    marginBottom: "20px",
    color: "#2c3e50",
};

const formGroup = {
    marginBottom: "20px",
};

const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
    color: "#333",
};

const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
};

const textareaStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
};

const modalButtons = {
    display: "flex",
    gap: "10px",
    marginTop: "25px",
};

const submitButton = {
    flex: 1,
    padding: "12px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
};

const cancelButton = {
    flex: 1,
    padding: "12px",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
};
