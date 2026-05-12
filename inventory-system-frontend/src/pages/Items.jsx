// pages/Items.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

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

export default function Items() {
    const [items, setItems] = useState([]);
    const [places, setPlaces] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        quantity: 0,
        serial_number: "",
        description: "",
        place_id: "",
        status: "in_store",
        image: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchItems();
        fetchPlaces();
    }, [statusFilter, searchTerm]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            let url = "/items?per_page=50";
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }
            
            const response = await api.get(url);
            console.log("Items API Response:", response.data);
            
            // Handle different response structures
            let itemsData = [];
            if (response.data?.data?.data) {
                itemsData = response.data.data.data;
            } else if (response.data?.data) {
                itemsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                itemsData = response.data;
            }
            
            setItems(itemsData);
        } catch (error) {
            console.error("Failed to fetch items:", error);
            setError("Failed to load items");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlaces = async () => {
        try {
            const response = await api.get("/places?per_page=100");
            console.log("Places API Response:", response.data);
            
            // Handle different response structures
            let placesData = [];
            if (response.data?.data?.data) {
                placesData = response.data.data.data;
            } else if (response.data?.data) {
                placesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                placesData = response.data;
            }
            
            setPlaces(placesData);
        } catch (error) {
            console.error("Failed to fetch places:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        if (!formData.place_id) {
            setError("Please select a storage place");
            return;
        }
        
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined && formData[key] !== "") {
                formDataToSend.append(key, formData[key]);
            }
        });
        
        if (editing) {
            formDataToSend.append("_method", "PUT");
        }
        
        try {
            if (editing) {
                await api.post(`/items/${editing.id}`, formDataToSend);
                setSuccess("Item updated successfully!");
            } else {
                await api.post("/items", formDataToSend);
                setSuccess("Item created successfully!");
            }
            
            setShowModal(false);
            setEditing(null);
            setFormData({
                name: "",
                code: "",
                quantity: 0,
                serial_number: "",
                description: "",
                place_id: "",
                status: "in_store",
                image: null
            });
            fetchItems();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Failed to save item:", error);
            setError(error.response?.data?.message || "Failed to save item");
        }
    };

    const handleEdit = (item) => {
        setEditing(item);
        setFormData({
            name: item.name,
            code: item.code,
            quantity: item.quantity,
            serial_number: item.serial_number || "",
            description: item.description || "",
            place_id: item.place_id,
            status: item.status,
            image: null
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        
        try {
            await api.delete(`/items/${id}`);
            setSuccess("Item deleted successfully!");
            fetchItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Failed to delete item:", error);
            setError(error.response?.data?.message || "Failed to delete item");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleQuantityChange = async (id, amount, action) => {
        try {
            if (action === "increment") {
                await api.post(`/items/${id}/increment-quantity`, { amount });
                setSuccess(`Added ${amount} item(s)`);
            } else {
                await api.post(`/items/${id}/decrement-quantity`, { amount });
                setSuccess(`Removed ${amount} item(s)`);
            }
            fetchItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update quantity");
            setTimeout(() => setError(""), 3000);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            in_store: { color: "#2ecc71", label: "In Store" },
            borrowed: { color: "#e67e22", label: "Borrowed" },
            damaged: { color: "#e74c3c", label: "Damaged" },
            missing: { color: "#95a5a6", label: "Missing" }
        };
        const badge = badges[status] || badges.in_store;
        return (
            <span style={{
                backgroundColor: badge.color,
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "bold"
            }}>
                {badge.label}
            </span>
        );
    };

    const getLowStockStyle = (quantity) => {
        if (quantity === 0) return { color: "#e74c3c", fontWeight: "bold" };
        if (quantity <= 5) return { color: "#e67e22", fontWeight: "bold" };
        return { color: "#2ecc71" };
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <div style={spinner}></div>
                <p>Loading items...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={headerStyle}>
                <div>
                    <h1>Inventory Items</h1>
                    <p style={subtitle}>Manage your inventory items, track stock, and update status</p>
                </div>
                <button onClick={() => setShowModal(true)} style={primaryButton}>
                    + Add Item
                </button>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}

            {/* Filters */}
            <div style={filterContainer}>
                <div style={searchBox}>
                    <input
                        type="text"
                        placeholder="Search by name, code, or serial number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={searchInput}
                    />
                    <button onClick={fetchItems} style={searchButton}>Search</button>
                </div>
                
                <div style={filterButtons}>
                    <button 
                        onClick={() => setStatusFilter("all")} 
                        style={{ ...filterButton, ...(statusFilter === "all" ? activeFilter : {}) }}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setStatusFilter("in_store")} 
                        style={{ ...filterButton, ...(statusFilter === "in_store" ? activeFilter : {}) }}
                    >
                        In Store
                    </button>
                    <button 
                        onClick={() => setStatusFilter("borrowed")} 
                        style={{ ...filterButton, ...(statusFilter === "borrowed" ? activeFilter : {}) }}
                    >
                        Borrowed
                    </button>
                    <button 
                        onClick={() => setStatusFilter("damaged")} 
                        style={{ ...filterButton, ...(statusFilter === "damaged" ? activeFilter : {}) }}
                    >
                        Damaged
                    </button>
                    <button 
                        onClick={() => setStatusFilter("missing")} 
                        style={{ ...filterButton, ...(statusFilter === "missing" ? activeFilter : {}) }}
                    >
                        Missing
                    </button>
                </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
                <div style={emptyState}>
                    <span style={emptyIcon}>📦</span>
                    <p>No items found. Click "Add Item" to create your first item.</p>
                </div>
            ) : (
                <div style={tableContainer}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td><code style={codeStyle}>{item.code}</code></td>
                                    <td>
                                        <strong>{item.name}</strong>
                                        {item.serial_number && (
                                            <div style={serialSmall}>SN: {item.serial_number}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ ...getLowStockStyle(item.quantity), fontSize: "16px" }}>
                                            {item.quantity}
                                        </div>
                                        <div style={quantityButtons}>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1, "increment")}
                                                style={qtyButton}
                                                title="Add one"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1, "decrement")}
                                                style={{ ...qtyButton, backgroundColor: "#e74c3c" }}
                                                title="Remove one"
                                                disabled={item.quantity === 0}
                                            >
                                                -
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        {item.place ? (
                                            <span style={{ fontSize: "13px" }}>
                                                {item.place.cupboard?.name || 'No Cupboard'} {'>'} {item.place.name}
                                            </span>
                                        ) : (
                                            <span style={{ color: "#999" }}>No location</span>
                                        )}
                                    </td>
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td style={{ fontSize: "12px" }}>{new Date(item.updated_at).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => handleEdit(item)} style={editButton}>Edit</button>
                                        <button onClick={() => handleDelete(item.id)} style={deleteButton}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Create/Edit Item */}
            {showModal && (
                <Modal onClose={() => {
                    setShowModal(false);
                    setEditing(null);
                    setFormData({
                        name: "",
                        code: "",
                        quantity: 0,
                        serial_number: "",
                        description: "",
                        place_id: "",
                        status: "in_store",
                        image: null
                    });
                }}>
                    <h2 style={modalTitle}>{editing ? "Edit Item" : "Add New Item"}</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>Item Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter item name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>Item Code *</label>
                                <input
                                    type="text"
                                    placeholder="Unique code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>Quantity *</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>Serial Number</label>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    value={formData.serial_number}
                                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>Storage Place *</label>
                                <select
                                    value={formData.place_id}
                                    onChange={(e) => setFormData({ ...formData, place_id: e.target.value })}
                                    required
                                    style={inputStyle}
                                >
                                    <option value="">-- Select a storage place --</option>
                                    {places.length > 0 ? (
                                        places.map((place) => (
                                            <option key={place.id} value={place.id}>
                                                {place.cupboard?.name || 'No Cupboard'} {'>'} {place.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No places available. Please create a place first.</option>
                                    )}
                                </select>
                                {places.length === 0 && (
                                    <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "5px" }}>
                                        No places found. Please add a place in the Places page first.
                                    </div>
                                )}
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="in_store">In Store</option>
                                    <option value="borrowed">Borrowed</option>
                                    <option value="damaged">Damaged</option>
                                    <option value="missing">Missing</option>
                                </select>
                            </div>
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                placeholder="Item description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                style={textareaStyle}
                            />
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Item Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                style={fileInputStyle}
                            />
                        </div>

                        <div style={modalButtons}>
                            <button type="submit" style={submitButton}>
                                {editing ? "Update Item" : "Create Item"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setShowModal(false);
                                    setEditing(null);
                                    setFormData({
                                        name: "",
                                        code: "",
                                        quantity: 0,
                                        serial_number: "",
                                        description: "",
                                        place_id: "",
                                        status: "in_store",
                                        image: null
                                    });
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

const filterContainer = {
    marginBottom: "20px",
};

const searchBox = {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
};

const searchInput = {
    flex: 1,
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
};

const searchButton = {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

const filterButtons = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
};

const filterButton = {
    padding: "8px 16px",
    backgroundColor: "#ecf0f1",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

const activeFilter = {
    backgroundColor: "#3498db",
    color: "white",
};

const tableContainer = {
    overflowX: "auto",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
};

const codeStyle = {
    backgroundColor: "#f8f9fa",
    padding: "4px 6px",
    borderRadius: "4px",
    fontSize: "12px",
};

const serialSmall = {
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
};

const quantityButtons = {
    display: "flex",
    gap: "5px",
    marginTop: "5px",
};

const qtyButton = {
    width: "28px",
    height: "28px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
};

const editButton = {
    padding: "5px 10px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "5px",
};

const deleteButton = {
    padding: "5px 10px",
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

const successStyle = {
    backgroundColor: "#d4edda",
    color: "#155724",
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
    width: "700px",
    maxWidth: "90%",
    maxHeight: "90%",
    overflowY: "auto",
};

const modalTitle = {
    marginBottom: "20px",
    color: "#2c3e50",
};

const formRow = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginBottom: "15px",
};

const formGroup = {
    marginBottom: "15px",
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

const fileInputStyle = {
    width: "100%",
    padding: "8px",
};

const modalButtons = {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
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

// Add this CSS to your App.css or global CSS
const globalStyles = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        transition: all 0.2s;
    }
    
    tr:hover {
        background-color: #f8f9fa;
    }
`;