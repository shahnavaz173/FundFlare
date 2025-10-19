import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Collapse,
  TextField,
  MenuItem,
  Fab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import SavingsIcon from "@mui/icons-material/Savings";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { listenToTransactions } from "../services/transactionService";
import { getAccountById } from "../services/accountService";
import { useAuth } from "../context/AuthContext";

export default function AccountDetailPage() {
  const { id } = useParams(); // Account ID
  const { user } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Collapse toggle for mobile filters
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch account details
    getAccountById(user.uid, id).then(setAccount);

    // Listen to all transactions and filter by account ID
    const unsub = listenToTransactions(user.uid, (allTxns) => {
      const filtered = allTxns
        .filter((t) => t.accountId === id)
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setTransactions(filtered);
      setFilteredTransactions(filtered);
    });

    return () => unsub && unsub();
  }, [user, id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    if (fromDate)
      filtered = filtered.filter(
        (t) => t.createdAt?.toDate() >= new Date(fromDate)
      );

    if (toDate)
      filtered = filtered.filter(
        (t) => t.createdAt?.toDate() <= new Date(toDate)
      );

    if (month)
      filtered = filtered.filter(
        (t) => t.createdAt?.toDate().getMonth() + 1 === parseInt(month)
      );

    if (year)
      filtered = filtered.filter(
        (t) => t.createdAt?.toDate().getFullYear() === parseInt(year)
      );

    setFilteredTransactions(filtered);
  }, [fromDate, toDate, month, year, transactions]);

  // Helper arrays for filters
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(
    new Set(transactions.map((t) => t.createdAt?.toDate().getFullYear()))
  ).sort((a, b) => b - a);

const handleAddTransaction = () => {
  navigate(`/dashboard/transactions/add/${id}`, { state: { preselectedAccountId: id } });
};


// Choose icon based on account type
const getAccountIcon = (type) => {
  switch (type.toLowerCase()) {
    case "asset":
      return <AccountBalanceIcon sx={{ fontSize: 40, color: "#388e3c" }} />; // green
    case "party":
      return <CreditCardIcon sx={{ fontSize: 40, color: "#f57c00" }} />; // orange
    case "fund": // Reserved Fund
      return <AccountBalanceWalletIcon sx={{ fontSize: 40, color: "#1976d2" }} />; // dark blue
    default:
      return <AccountBalanceIcon sx={{ fontSize: 40, color: "#6c757d" }} />; // grey fallback
  }
};



  return (
    <Box sx={{ p: 3, position: "relative", minHeight: "100vh" }}>
      {/* Improved Account Card */}
      {account && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            boxShadow: 4,
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
          }}
        >
          {/* Floating accent circle */}
          <Box
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.2)",
            }}
          />

          <Stack direction="row" alignItems="center" spacing={2}>
            {getAccountIcon(account.type)}
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {account.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Type: {account.type}
              </Typography>
            </Box>
          </Stack>

          <Typography
            variant="h4"
            fontWeight="bold"
            color={account.balance >= 0 ? "success.main" : "error.main"}
            sx={{ mt: 2 }}
          >
            ₹ {Number(account.balance || 0).toLocaleString()}
          </Typography>

        </Paper>
      )}

      {/* Filter Collapse Toggle for Mobile */}
      <Button
        variant="outlined"
        sx={{ mb: 1, display: { xs: "block", sm: "none" } }}
        fullWidth
        onClick={() => setShowFilters((prev) => !prev)}
      >
        {showFilters ? "Hide Filters" : "Show Filters"}
      </Button>

      {/* Filters */}
      <Collapse in={showFilters || window.innerWidth >= 600}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Search Transactions
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            flexWrap="wrap"
          >
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              select
              label="Month"
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              sx={{ flex: 1, minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              {months.map((m) => (
                <MenuItem key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Year"
              size="small"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              sx={{ flex: 1, minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>
      </Collapse>

      {/* Transaction Cards */}
      {filteredTransactions.length === 0 ? (
        <Typography>No transactions found for this account.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {filteredTransactions.map((t) => (
            <Paper
              key={t.id}
              sx={{
                p: 2,
                borderLeft: `5px solid ${t.type === "credit" ? "green" : "red"}`,
                boxShadow: 2,
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                ₹{t.amount} ({t.type})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.createdAt?.toDate().toLocaleString()}
              </Typography>
              {t.note && (
                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", mt: 0.5 }}
                >
                  📝 {t.note}
                </Typography>
              )}

              {/* Edit Button */}
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => navigate(`/dashboard/transactions/edit/${t.id}`)}
              >
                Edit
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddTransaction}
        sx={{
          position: "fixed",
          bottom: 70,
          right: 24,
          boxShadow: "0 6px 10px rgba(0,0,0,0.3)",
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
