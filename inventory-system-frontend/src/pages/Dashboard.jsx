import { useUser } from "../contexts/UserContext";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name}! 👋</p>
      <p>You are logged in as: <strong>{user?.role}</strong></p>
      
      <div style={statsContainer}>
        <div style={statCard}>
          <h3>Total Items</h3>
          <p style={statNumber}>0</p>
        </div>
        <div style={statCard}>
          <h3>Cupboards</h3>
          <p style={statNumber}>0</p>
        </div>
        <div style={statCard}>
          <h3>Users</h3>
          <p style={statNumber}>0</p>
        </div>
      </div>
    </div>
  );
}

const statsContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "30px",
};

const statCard = {
  padding: "20px",
  backgroundColor: "#3498db",
  color: "white",
  borderRadius: "8px",
  textAlign: "center",
};

const statNumber = {
  fontSize: "32px",
  fontWeight: "bold",
  margin: "10px 0 0 0",
};