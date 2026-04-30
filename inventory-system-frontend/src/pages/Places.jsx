// pages/Places.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Places() {
  const [places, setPlaces] = useState([]);
  const [cupboards, setCupboards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cupboard_id: "",
    shelf_number: "",
    description: ""
  });

  useEffect(() => {
    fetchPlaces();
    fetchCupboards();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await api.get("/places");
      setPlaces(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch places:", err);
    }
  };

  const fetchCupboards = async () => {
    try {
      const res = await api.get("/cupboards");
      setCupboards(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch cupboards:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/places", formData);
      setShowModal(false);
      setFormData({ name: "", cupboard_id: "", shelf_number: "", description: "" });
      fetchPlaces();
    } catch (err) {
      console.error("Failed to create place:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>Storage Places</h2>
        <button onClick={() => setShowModal(true)} style={buttonStyle}>+ Add Place</button>
      </div>
      
      <div style={{ display: "grid", gap: "15px" }}>
        {places.map(place => (
          <div key={place.id} style={cardStyle}>
            <h3>{place.name}</h3>
            <p>Cupboard: {place.cupboard?.name}</p>
            {place.shelf_number && <p>Shelf: {place.shelf_number}</p>}
            {place.description && <p>{place.description}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h3>Add New Place</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Place Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={inputStyle}
            />
            <select
              value={formData.cupboard_id}
              onChange={(e) => setFormData({ ...formData, cupboard_id: e.target.value })}
              required
              style={inputStyle}
            >
              <option value="">Select Cupboard</option>
              {cupboards.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Shelf Number"
              value={formData.shelf_number}
              onChange={(e) => setFormData({ ...formData, shelf_number: e.target.value })}
              style={inputStyle}
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>Create</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Styles
const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const cardStyle = {
  padding: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9"
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginBottom: "10px",
  border: "1px solid #ddd",
  borderRadius: "4px"
};

const Modal = ({ children, onClose }) => (
  <div style={{
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
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "30px",
      borderRadius: "8px",
      width: "500px",
      maxWidth: "90%"
    }}>
      {children}
      <button onClick={onClose} style={{ marginTop: "10px", ...buttonStyle, backgroundColor: "#95a5a6" }}>Close</button>
    </div>
  </div>
);