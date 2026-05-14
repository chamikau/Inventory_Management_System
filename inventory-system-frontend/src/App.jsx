import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Cupboards from "./pages/Cupboards";
import Places from "./pages/Places";
import Items from "./pages/Items";
import Borrowings from "./pages/Borrowings";
import AuditLogs from "./pages/AuditLogs";

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
        <ProtectedRoute>
          <Layout>
            <Users />.
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/cupboards" element={
        <ProtectedRoute>
          <Layout>
            <Cupboards />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/places" element={
        <ProtectedRoute>
          <Layout>
            <Places />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/borrowings" element={
        <ProtectedRoute>
          <Layout>
            <Borrowings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/items" element={
        <ProtectedRoute>
          <Layout>
            <Items />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/audit-logs" element={
        <ProtectedRoute>
          <Layout>
            <AuditLogs />
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