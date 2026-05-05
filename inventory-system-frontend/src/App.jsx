// App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Cupboards from "./pages/Cupboards";
// import Places from "./pages/Places";
// import Items from "./pages/Items";
// import Borrowings from "./pages/Borrowings";

// Protected Route wrapper
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useUser();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" />;
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <Users />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Add other routes similarly */}
      <Route path="/cupboards" element={
        <ProtectedRoute>
          <Layout>
            <Cupboards />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;