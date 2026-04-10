import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import AccountDetailPage from "./pages/AccountDetailPage";
import EditTransactionPage from "./pages/EditTransactionPage";
import AddAccountPage from "./pages/AddAccountPage";
import AddTransactionPage from "./pages/AddTransactionPage";
import StatementViewerPage from "./pages/StatementViewerPage";
import ImportTransactionsPage from "./pages/ImportTransactionsPage";
import { CircularProgress, Box } from "@mui/material";
// Test comment
export default function App() {
  const { user, loading } = useAuth();

  // 👇 Wait for Firebase auth to finish initializing
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      <Route
        path="/dashboard/*"
        element={user ? <DashboardLayout /> : <Navigate to="/login" />}
      >
        <Route index element={<DashboardHome />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="accounts/:id" element={<AccountDetailPage />} />
        <Route path="accounts/add" element={<AddAccountPage />} />
        <Route path="accounts/:id/statement" element={<StatementViewerPage />} />

        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transactions/add" element={<AddTransactionPage />} />
        <Route
          path="transactions/add/:preselectedAccountId"
          element={<AddTransactionPage />}
        />
        <Route path="transactions/edit/:txnId" element={<EditTransactionPage />} />
        <Route path="import-transactions" element={<ImportTransactionsPage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}
