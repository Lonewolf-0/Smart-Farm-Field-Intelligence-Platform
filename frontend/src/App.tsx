import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import MapPage from "./pages/MapPage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";
import BranchesPage from "./pages/BranchesPage.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import { AuthProvider } from "./context/AuthContext";
import { FieldProvider } from "./context/FieldContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <FieldProvider>
        <Layout>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </FieldProvider>
    </AuthProvider>
  );
}

export default App;
