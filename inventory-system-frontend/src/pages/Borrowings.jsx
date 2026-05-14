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

export default function Borrowings() {
    const [borrowings, setBorrowings] = useState([]);
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        borrower_name: "",
        contact_details: "",
        quantity_borrowed: 1,
        expected_return_date: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("active");

    useEffect(() => {
        fetchBorrowings();
        fetchItems();
    }, [activeTab]);

    const fetchBorrowings = async () => {
        setLoading(true);
        try {
            let url = "/borrowings";
            if (activeTab === "active") {
                url = "/borrowings/active/current";
            } else if (activeTab === "overdue") {
                url = "/borrowings/overdue";
            }
            
            const response = await api.get(url);
            const borrowingsData = response.data.data.data || response.data.data || [];
            setBorrowings(borrowingsData);
        } catch (error) {
            console.error("Failed to fetch borrowings:", error);
            setError("Failed to load borrowings");
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await api.get("/items?status=in_store&per_page=100");
            const itemsData = response.data.data?.data || response.data.data || [];
            setItems(itemsData);
        } catch (error) {
            console.error("Failed to fetch items:", error);
        }
    };

    const handleBorrow = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        try {
            await api.post(`/items/${selectedItem.id}/borrow`, formData);
            setSuccess(`Successfully borrowed ${formData.quantity_borrowed} x ${selectedItem.name}`);
            setShowModal(false);
            setSelectedItem(null);
            setFormData({
                borrower_name: "",
                contact_details: "",
                quantity_borrowed: 1,
                expected_return_date: ""
            });
            fetchBorrowings();
            fetchItems();
        } catch (error) {
            console.error("Failed to borrow item:", error);
            setError(error.response?.data?.message || "Failed to borrow item");
        }
    };

    const handleReturn = async (borrowingId) => {
        if (!window.confirm("Confirm return of this item?")) return;
        
        setError("");
        setSuccess("");
        
        try {
            await api.post(`/borrowings/${borrowingId}/return`);
            setSuccess("Item returned successfully!");
            fetchBorrowings();
            fetchItems();
        } catch (error) {
            console.error("Failed to return item:", error);
            setError(error.response?.data?.message || "Failed to return item");
        }
    };

    const getStatusBadge = (borrowing) => {
        if (borrowing.status === 'returned') {
            return <span style={returnedBadge}>Returned</span>;
        }
        
        const isOverdue = new Date(borrowing.expected_return_date) < new Date();
        if (isOverdue) {
            return <span style={overdueBadge}>Overdue</span>;
        }
        
        return <span style={activeBadge}>Active</span>;
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <p>Loading borrowings...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={headerStyle}>
                <div>
                    <h1>Borrowing Management</h1>
                    <p style={subtitle}>Track borrowed items and manage returns</p>
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}

            <div style={tabContainer}>
                <button
                    onClick={() => setActiveTab("active")}
                    style={{ ...tabButton, ...(activeTab === "active" ? activeTabButton : {}) }}
                >
                    Active Borrowings
                </button>
                <button
                    onClick={() => setActiveTab("overdue")}
                    style={{ ...tabButton, ...(activeTab === "overdue" ? activeTabButton : {}) }}
                >
                    Overdue
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    style={{ ...tabButton, ...(activeTab === "all" ? activeTabButton : {}) }}
                >
                    All History
                </button>
            </div>

            <div style={availableSection}>
                <h3>Available Items to Borrow</h3>
                <div style={availableGrid}>
                    {items.filter(item => item.quantity > 0).slice(0, 6).map((item) => (
                        <div key={item.id} style={availableCard}>
                            <div>
                                <strong>{item.name}</strong>
                                <div style={itemCode}>{item.code}</div>
                                <div style={itemStock}>Stock: {item.quantity}</div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedItem(item);
                                    setFormData({ ...formData, quantity_borrowed: 1 });
                                    setShowModal(true);
                                }}
                                style={borrowButton}
                            >
                                Borrow
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {borrowings.length === 0 ? (
                <div style={emptyState}>
                    <span style={emptyIcon}>📋</span>
                    <p>No borrowings found.</p>
                </div>
            ) : (
                <div style={tableContainer}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Borrower</th>
                                <th>Quantity</th>
                                <th>Borrow Date</th>
                                <th>Expected Return</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {borrowings.map((borrowing) => (
                                <tr key={borrowing.id} style={borrowing.status === 'overdue' ? overdueRow : {}}>
                                    <td>
                                        <strong>{borrowing.item?.name}</strong>
                                        <div style={itemCode}>{borrowing.item?.code}</div>
                                    </td>
                                    <td>
                                        {borrowing.borrower_name}
                                        <div style={contactSmall}>{borrowing.contact_details}</div>
                                    </td>
                                    <td>{borrowing.quantity_borrowed}</td>
                                    <td>{new Date(borrowing.borrow_date).toLocaleDateString()}</td>
                                    <td>
                                        {new Date(borrowing.expected_return_date).toLocaleDateString()}
                                        {borrowing.is_overdue && (
                                            <div style={overdueDays}>
                                                {borrowing.days_overdue} days overdue
                                            </div>
                                        )}
                                    </td>
                                    <td>{getStatusBadge(borrowing)}</td>
                                    <td>
                                        {borrowing.status === 'borrowed' && (
                                            <button
                                                onClick={() => handleReturn(borrowing.id)}
                                                style={returnButton}
                                            >
                                                Return
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && selectedItem && (
                <Modal onClose={() => setShowModal(false)}>
                    <h2 style={modalTitle}>Borrow Item</h2>
                    <div style={itemInfo}>
                        <strong>{selectedItem.name}</strong>
                        <div>Code: {selectedItem.code}</div>
                        <div>Available: {selectedItem.quantity}</div>
                    </div>
                    
                    <form onSubmit={handleBorrow}>
                        <div style={formGroup}>
                            <label style={labelStyle}>Borrower Name *</label>
                            <input
                                type="text"
                                placeholder="Enter borrower name"
                                value={formData.borrower_name}
                                onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Contact Details *</label>
                            <input
                                type="text"
                                placeholder="Phone number or email"
                                value={formData.contact_details}
                                onChange={(e) => setFormData({ ...formData, contact_details: e.target.value })}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Quantity *</label>
                            <input
                                type="number"
                                min="1"
                                max={selectedItem.quantity}
                                value={formData.quantity_borrowed}
                                onChange={(e) => setFormData({ ...formData, quantity_borrowed: parseInt(e.target.value) })}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroup}>
                            <label style={labelStyle}>Expected Return Date *</label>
                            <input
                                type="date"
                                value={formData.expected_return_date}
                                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                style={inputStyle}
                            />
                        </div>

                        <div style={modalButtons}>
                            <button type="submit" style={submitButton}>
                                Confirm Borrow
                            </button>
                            <button type="button" onClick={() => setShowModal(false)} style={cancelButton}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

const headerStyle = {
    marginBottom: "30px",
};

const subtitle = {
    color: "#666",
    marginTop: "5px",
    fontSize: "14px",
};

const tabContainer = {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    borderBottom: "1px solid #ddd",
};

const tabButton = {
    padding: "10px 20px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "#666",
};

const activeTabButton = {
    color: "#3498db",
    borderBottom: "2px solid #3498db",
};

const availableSection = {
    marginBottom: "30px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
};

const availableGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "15px",
    marginTop: "15px",
};

const availableCard = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
};

const itemCode = {
    fontSize: "12px",
    color: "#666",
    marginTop: "3px",
};

const itemStock = {
    fontSize: "12px",
    color: "#2ecc71",
    marginTop: "5px",
};

const borrowButton = {
    padding: "6px 15px",
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

const tableContainer = {
    overflowX: "auto",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
};

const activeBadge = {
    backgroundColor: "#2ecc71",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
};

const overdueBadge = {
    backgroundColor: "#e74c3c",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
};

const returnedBadge = {
    backgroundColor: "#95a5a6",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
};

const returnButton = {
    padding: "5px 12px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
};

const overdueRow = {
    backgroundColor: "#fff3f0",
};

const overdueDays = {
    fontSize: "11px",
    color: "#e74c3c",
    marginTop: "2px",
};

const contactSmall = {
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
};

const itemInfo = {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
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
    width: "500px",
    maxWidth: "90%",
};

const modalTitle = {
    marginBottom: "20px",
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

const modalButtons = {
    display: "flex",
    gap: "10px",
    marginTop: "25px",
};

const submitButton = {
    flex: 1,
    padding: "12px",
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

const cancelButton = {
    flex: 1,
    padding: "12px",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};