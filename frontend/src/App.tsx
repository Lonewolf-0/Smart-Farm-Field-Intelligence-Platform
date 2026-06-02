import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import MapPage from "./pages/MapPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import BranchesPage from "./pages/BranchesPage.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
