// contexts/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

// Create the context
const UserContext = createContext();

// Custom hook to use the context (easier than using useContext directly)
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Provider component that wraps your app
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user on app load
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/me");
      setUser(response.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/login", { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      setUser(user);
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        updateUser,
        isAdmin: user?.role === "admin",
        isStaff: user?.role === "staff",
      }}
    >
      {children}
    </UserContext.Provider>
  );
}