import { useEffect, useState } from "react";
import api from "../services/api";

export default function Cupboards() {
  const [cupboards, setCupboards] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchCupboards = async () => {
    const res = await api.get("/cupboards");
    setCupboards(res.data);
  };

  useEffect(() => {
    fetchCupboards();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/cupboards", {
      name,
      description,
    });

    setName("");
    setDescription("");
    fetchCupboards();
  };

  const handleDelete = async (id) => {
    await api.delete(`/cupboards/${id}`);
    fetchCupboards();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Cupboards</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <br />

      <ul>
        {cupboards.map((c) => (
          <li key={c.id}>
            <b>{c.name}</b> - {c.description}
            <button onClick={() => handleDelete(c.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}