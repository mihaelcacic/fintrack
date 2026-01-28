import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import UserRoute from "./auth/UserRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import SavingsPage from "./pages/SavingsPage";
import AnalysisPage from "./pages/AnalysisPage";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";
import ImportPage from "./pages/ImportPage";
import RoleBasedRedirect from "./components/RoleBasedRedirect";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<RoleBasedRedirect />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<UserRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/import" element={<ImportPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<div>404</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
