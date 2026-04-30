// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ 
        flex: 1, 
        padding: "20px", 
        marginLeft: "250px",
        backgroundColor: "#f5f5f5"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          minHeight: "calc(100vh - 40px)"
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}