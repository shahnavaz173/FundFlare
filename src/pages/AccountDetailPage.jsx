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
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { listenToTransactions, deleteTransaction } from "../services/transactionService";
import { getAccountById } from "../services/accountService";
import { useAuth } from "../context/AuthContext";

export default function AccountDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) return;

    getAccountById(user.uid, id).then(setAccount);
    const unsub = listenToTransactions(user.uid, (allTxns) => {
      const filtered = allTxns
        .filter((t) => t.accountId === id)
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setTransactions(filtered);
      setFilteredTransactions(filtered);
    });

    return () => unsub && unsub();
  }, [user, id]);

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

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(
    new Set(transactions.map((t) => t.createdAt?.toDate().getFullYear()))
  ).sort((a, b) => b - a);

  const handleAddTransaction = () => {
    navigate(`/dashboard/transactions/add/${id}`, {
      state: { preselectedAccountId: id },
    });
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    await deleteTransaction(user.uid, txnId);
  };

  const getAccountIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "asset":
        return <AccountBalanceIcon sx={{ fontSize: 42, color: "#2e7d32" }} />;
      case "party":
        return <CreditCardIcon sx={{ fontSize: 42, color: "#ef6c00" }} />;
      case "fund":
        return <AccountBalanceWalletIcon sx={{ fontSize: 42, color: "#1976d2" }} />;
      default:
        return <AccountBalanceIcon sx={{ fontSize: 42, color: "#6c757d" }} />;
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f9fafc, #eef3f7)",
        pb: 10,
      }}
    >
      {/* Page Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptLongIcon
            sx={{
              fontSize: 28,
              color: "primary.main",
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.3rem", sm: "1.5rem" },
            }}
          >
            Transactions
          </Typography>
        </Stack>

        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowFilters((prev) => !prev)}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            textTransform: "none",
          }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </Stack>

      {/* Account Header */}
      {account && (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 55,
                height: 55,
                borderRadius: "50%",
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 2,
              }}
            >
              {getAccountIcon(account.type)}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {account.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {account.type}
              </Typography>
            </Box>
          </Stack>

          <Typography
            variant="h5"
            fontWeight="bold"
            color={account.balance >= 0 ? "success.main" : "error.main"}
            sx={{ mt: 1 }}
          >
            ₹ {Number(account.balance || 0).toLocaleString()}
          </Typography>
        </Paper>
      )}

      {/* Filters */}
      <Collapse in={showFilters || !isMobile}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Filter Transactions
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            flexWrap="wrap"
          >
            <TextField
              label="From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Month"
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              sx={{ flex: 1 }}
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
              sx={{ flex: 1 }}
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

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <Typography
          sx={{
            textAlign: "center",
            color: "text.secondary",
            mt: 5,
          }}
        >
          No transactions found 💭
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          {filteredTransactions.map((t, index) => {
            const isCredit = t.type === "credit";
            const bgColor = isCredit
              ? "linear-gradient(135deg, #e8f5e9, #c8e6c9)"
              : "linear-gradient(135deg, #ffebee, #ffcdd2)";
            const textColor = isCredit ? "success.main" : "error.main";

            return (
              <Box
                key={t.id}
                sx={{
                  animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                  "@keyframes fadeIn": {
                    from: { opacity: 0, transform: "translateY(6px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 1, sm: 1.3 },
                    borderRadius: 2,
                    background: bgColor,
                    borderLeft: `5px solid ${
                      isCredit ? "#2e7d32" : "#c62828"
                    }`,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color={textColor}
                        sx={{
                          lineHeight: 1.1,
                          fontSize: { xs: "0.95rem", sm: "1rem" },
                        }}
                      >
                        ₹{Number(t.amount).toLocaleString()}
                      </Typography>
                      {t.note && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.3,
                            fontStyle: "italic",
                            color: "text.secondary",
                            fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          }}
                        >
                          📝 {t.note}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mt: 0.3,
                          fontSize: { xs: "0.65rem", sm: "0.7rem" },
                        }}
                      >
                        {t.createdAt?.toDate().toLocaleString()}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        sx={{
                          color: textColor,
                          p: 0.5,
                          "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
                        }}
                        onClick={() =>
                          navigate(`/dashboard/transactions/edit/${t.id}`)
                        }
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      {/* 🗑️ Delete Button */}
                      <IconButton
                        size="small"
                        sx={{
                          color: "error.main",
                          p: 0.5,
                          "&:hover": { bgcolor: "rgba(255,0,0,0.08)" },
                        }}
                        onClick={() => handleDeleteTransaction(t.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddTransaction}
        sx={{
          position: "fixed",
          bottom: 70,
          right: 24,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          boxShadow: "0 6px 15px rgba(0,0,0,0.25)",
        }}
      >
        <AddIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
      </Fab>
    </Box>
  );
}
