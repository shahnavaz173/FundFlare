import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Collapse,
  TextField,
  Grid,
  Chip,
  Autocomplete,
  MenuItem,
  Fab,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToTransactions, deleteTransaction } from "../services/transactionService";
import { listenToAccounts } from "../services/accountService";

export default function TransactionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const accountTypes = ["Asset", "Party", "Fund"];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(
    new Set(transactions.map((t) => t.createdAt?.toDate().getFullYear()))
  ).sort((a, b) => b - a);

  // Listen to transactions
  useEffect(() => {
    if (!user) return;
    const unsub = listenToTransactions(user.uid, setTransactions);
    return () => unsub && unsub();
  }, [user]);

  // Listen to accounts for filters
  useEffect(() => {
    if (!user) return;
    const unsub = listenToAccounts(user.uid, setAccounts);
    return () => unsub && unsub();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    if (selectedTypes.length) {
      filtered = filtered.filter((t) => selectedTypes.includes(t.accountType));
    }

    if (selectedAccounts.length) {
      filtered = filtered.filter(
        (t) =>
          selectedAccounts.includes(t.accountName) ||
          selectedAccounts.includes(t.accountId)
      );
    }

    if (dateRange.from) {
      filtered = filtered.filter(
        (t) =>
          t.createdAt &&
          new Date(t.createdAt.toDate()) >= new Date(dateRange.from)
      );
    }

    if (dateRange.to) {
      filtered = filtered.filter(
        (t) =>
          t.createdAt &&
          new Date(t.createdAt.toDate()) <= new Date(dateRange.to)
      );
    }

    if (month) {
      filtered = filtered.filter(
        (t) =>
          t.createdAt &&
          new Date(t.createdAt.toDate()).getMonth() + 1 ===
            parseInt(month, 10)
      );
    }

    if (year) {
      filtered = filtered.filter(
        (t) =>
          t.createdAt &&
          new Date(t.createdAt.toDate()).getFullYear() === parseInt(year, 10)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedTypes, selectedAccounts, dateRange, month, year]);

  // ✅ Delete Transaction Handler
  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    await deleteTransaction(user.uid, txnId);
  };

  return (
    <Box sx={{ p: 3, position: "relative", minHeight: "100vh" }}>
      {/* --- Heading with Icon --- */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <ReceiptLongIcon sx={{ color: "primary.main", fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>
          Transactions
        </Typography>
      </Stack>

      {/* --- Filter Panel --- */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">Filters</Typography>
          <Button onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Hide" : "Show"}
          </Button>
        </Box>
        <Collapse in={showFilters}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack spacing={2} mt={2}>
              <Autocomplete
                multiple
                options={accountTypes}
                value={selectedTypes}
                onChange={(e, newVal) => setSelectedTypes(newVal)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip key={option} label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Account Type"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Autocomplete
                multiple
                options={accounts.map((a) => a.name)}
                value={selectedAccounts}
                onChange={(e, newVal) => setSelectedAccounts(newVal)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip key={option} label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Account Name"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Grid container spacing={2}>
                <TextField
                  label="From Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1, minWidth: 120 }}
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label="To Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1, minWidth: 120 }}
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  select
                  label="Month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  sx={{ flex: 1, minWidth: 120 }}
                  InputLabelProps={{ shrink: true }}
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
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  sx={{ flex: 1, minWidth: 120 }}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">All</MenuItem>
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Stack>
          </Paper>
        </Collapse>
      </Paper>

      {/* --- Transactions List --- */}
      <Stack spacing={1}>
        {filteredTransactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No transactions found.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
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
                      p: 1.3,
                      borderRadius: 2,
                      background: bgColor,
                      borderLeft: `5px solid ${
                        isCredit ? "#2e7d32" : "#c62828"
                      }`,
                      transition:
                        "transform 0.15s ease, box-shadow 0.15s ease",
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
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          color={textColor}
                          sx={{ fontSize: "0.95rem", lineHeight: 1.2 }}
                        >
                          ₹{Number(t.amount).toLocaleString()} —{" "}
                          <Typography
                            component="span"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.8rem",
                              ml: 0.5,
                            }}
                          >
                            {t.accountName || t.accountId}
                          </Typography>
                        </Typography>
                        {t.note && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.3,
                              fontStyle: "italic",
                              color: "text.secondary",
                              fontSize: "0.75rem",
                            }}
                          >
                            📝 {t.note}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.2 }}
                        >
                          {t.createdAt?.toDate().toLocaleString()}
                        </Typography>
                      </Box>

                      {/* ✏️ Edit + 🗑️ Delete Buttons */}
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
      </Stack>

      {/* --- Floating Add Transaction Button --- */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 70, right: 24 }}
        onClick={() => navigate("/dashboard/transactions/add")}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
