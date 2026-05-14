import { useEffect, useState, useRef } from "react";
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

export default function Items() {
    const [items, setItems] = useState([]);
    const [places, setPlaces] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [serialNumber, setSerialNumber] = useState("");
    const [description, setDescription] = useState("");
    const [placeId, setPlaceId] = useState("");
    const [status, setStatus] = useState("in_store");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchItems();
        fetchPlaces();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get("/items?per_page=50");
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
        } finally {
            setLoading(false);
        }
    };

    const fetchPlaces = async () => {
        try {
            const response = await api.get("/places?per_page=100");
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log("Selected file:", file);
        
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setError("Please select a valid image (JPEG, PNG, JPG, GIF)");
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                setError("Image size must be less than 2MB");
                return;
            }
            
            setImageFile(file);
            
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const resetForm = () => {
        setName("");
        setCode("");
        setQuantity(0);
        setSerialNumber("");
        setDescription("");
        setPlaceId("");
        setStatus("in_store");
        setImageFile(null);
        setImagePreview(null);
        setEditing(null);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        if (!name || !code || !placeId) {
            setError("Please fill all required fields");
            return;
        }
        
        const formData = new FormData();
        formData.append("name", name);
        formData.append("code", code);
        formData.append("quantity", quantity.toString());
        formData.append("serial_number", serialNumber || "");
        formData.append("description", description || "");
        formData.append("place_id", placeId);
        formData.append("status", status);
        
        if (imageFile) {
            formData.append("image", imageFile);
            console.log("Image appended:", imageFile.name, imageFile.size);
        } else {
            console.log("No image selected");
        }
        
        console.log("=== FormData Contents ===");
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
        
        try {
            let response;
            if (editing) {
                formData.append("_method", "PUT");
                response = await api.post(`/items/${editing.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setSuccess("Item updated successfully!");
            } else {
                response = await api.post("/items", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setSuccess("Item created successfully!");
            }
            
            console.log("API Response:", response.data);
            
            setShowModal(false);
            resetForm();
            fetchItems();
            
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("API Error:", error.response?.data || error);
            setError(error.response?.data?.message || "Failed to save item");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleEdit = (item) => {
        setEditing(item);
        setName(item.name);
        setCode(item.code);
        setQuantity(item.quantity);
        setSerialNumber(item.serial_number || "");
        setDescription(item.description || "");
        setPlaceId(item.place_id);
        setStatus(item.status);
        setImageFile(null);
        setImagePreview(item.image ? `http://localhost:8000/storage/${item.image}` : null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/items/${id}`);
            setSuccess("Item deleted!");
            fetchItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            setError(error.response?.data?.message || "Delete failed");
        }
    };

    const handleQuantityChange = async (id, amount, action) => {
        try {
            if (action === "increment") {
                await api.post(`/items/${id}/increment-quantity`, { amount });
            } else {
                await api.post(`/items/${id}/decrement-quantity`, { amount });
            }
            fetchItems();
        } catch (error) {
            setError(error.response?.data?.message);
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
                fontSize: "11px"
            }}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: "50px" }}>Loading items...</div>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1>Inventory Items</h1>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }} 
                    style={primaryButton}
                >
                    + Add Item
                </button>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}

            <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={tableHeader}>
                            <th style={thStyle}>Image</th>
                            <th style={thStyle}>Code</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Location</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} style={tableRow}>
                                <td style={tdStyle}>
                                    {item.image ? (
                                        <img 
                                            src={`http://localhost:8000/storage/${item.image}`} 
                                            alt={item.name}
                                            style={imageStyle}
                                        />
                                    ) : (
                                        <span style={{ fontSize: "24px" }}>📷</span>
                                    )}
                                </td>
                                <td style={tdStyle}><code>{item.code}</code></td>
                                <td style={tdStyle}><strong>{item.name}</strong></td>
                                <td style={tdStyle}>
                                    {item.quantity}
                                    <div style={{ marginTop: "5px" }}>
                                        <button 
                                            onClick={() => handleQuantityChange(item.id, 1, "increment")} 
                                            style={qtyButton}
                                        >+</button>
                                        <button 
                                            onClick={() => handleQuantityChange(item.id, 1, "decrement")} 
                                            style={{ ...qtyButton, backgroundColor: "#e74c3c", marginLeft: "5px" }}
                                            disabled={item.quantity === 0}
                                        >-</button>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    {item.place?.cupboard?.name} {'>'} {item.place?.name}
                                </td>
                                <td style={tdStyle}>{getStatusBadge(item.status)}</td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleEdit(item)} style={editButton}>Edit</button>
                                    <button onClick={() => handleDelete(item.id)} style={deleteButton}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal onClose={() => { setShowModal(false); resetForm(); }}>
                    <h2 style={{ marginBottom: "20px" }}>{editing ? "Edit Item" : "Add New Item"}</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={formGroup}>
                            <label style={labelStyle}>Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>
                        
                        <div style={formGroup}>
                            <label style={labelStyle}>Code *</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>
                        
                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>
                            
                            <div style={formGroup}>
                                <label style={labelStyle}>Serial Number</label>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        
                        <div style={formGroup}>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                style={textareaStyle}
                            />
                        </div>
                        
                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>Storage Place *</label>
                                <select
                                    value={placeId}
                                    onChange={(e) => setPlaceId(e.target.value)}
                                    required
                                    style={inputStyle}
                                >
                                    <option value="">Select a place</option>
                                    {places.map((place) => (
                                        <option key={place.id} value={place.id}>
                                            {place.cupboard?.name} {'>'} {place.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={formGroup}>
                                <label style={labelStyle}>Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
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
                            <label style={labelStyle}>Item Image</label>
                            {imagePreview && (
                                <div style={{ marginBottom: "10px" }}>
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
                                    />
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/gif"
                                onChange={handleImageChange}
                                style={fileInputStyle}
                            />
                            <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                                Supported: JPEG, PNG, JPG, GIF (Max 2MB)
                            </small>
                        </div>
                        
                        <div style={modalButtons}>
                            <button type="submit" style={submitButton}>
                                {editing ? "Update" : "Create"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setShowModal(false); resetForm(); }} 
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

const primaryButton = {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
};

const errorStyle = {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "12px",
    borderRadius: "5px",
    marginBottom: "20px",
};

const successStyle = {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "12px",
    borderRadius: "5px",
    marginBottom: "20px",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
};

const tableHeader = {
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #ddd",
};

const thStyle = {
    padding: "12px",
    textAlign: "left",
};

const tableRow = {
    borderBottom: "1px solid #ddd",
};

const tdStyle = {
    padding: "12px",
};

const imageStyle = {
    width: "40px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "4px",
};

const qtyButton = {
    padding: "2px 8px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
};

const editButton = {
    padding: "5px 10px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    marginRight: "5px",
};

const deleteButton = {
    padding: "5px 10px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
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
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
};

const textareaStyle = {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
};

const fileInputStyle = {
    width: "100%",
    padding: "8px",
};

const formRow = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
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
    borderRadius: "10px",
    width: "600px",
    maxWidth: "90%",
    maxHeight: "90%",
    overflowY: "auto",
};