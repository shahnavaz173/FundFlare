import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Stack,
  InputAdornment,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToAccounts } from "../services/accountService";
import {
  getTransactionById,
  updateTransaction,
} from "../services/transactionService";

import EditIcon from "@mui/icons-material/Edit";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import NotesIcon from "@mui/icons-material/Notes";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

export default function EditTransactionPage() {
  const { user } = useAuth();
  const { txnId } = useParams();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    accountId: "",
    type: "debit",
    amount: "",
    note: "",
    extraAccountId: "",
  });

  // Listen to accounts
  useEffect(() => {
    if (!user) return;
    const unsub = listenToAccounts(user.uid, setAccounts);
    return () => unsub && unsub();
  }, [user]);

  // Fetch transaction details
  useEffect(() => {
    if (!user || !txnId) return;
    getTransactionById(user.uid, txnId).then((txn) => {
      if (!txn) return;
      setForm({
        accountId: txn.accountId,
        type: txn.type,
        amount: txn.amount,
        note: txn.note || "",
        extraAccountId: txn.extraAccountId || "",
      });
    });
  }, [user, txnId]);

  const selectedAccount = accounts.find((a) => a.id === form.accountId);

  // ✅ Filter only enabled accounts for dropdowns
  const enabledAccounts = accounts.filter((a) => !a.disabled);

  // Determine if extra field should be shown
  let showExtraField = false;
  let extraFieldLabel = "";
  if (selectedAccount) {
    const type = selectedAccount.type?.toLowerCase();
    const accName = selectedAccount.name?.toLowerCase();
    const txnType = form.type;
    if (
      (accName === "investment" && txnType === "credit") ||
      (type === "party" && txnType === "debit") ||
      (type === "fund" && txnType === "credit")
    ) {
      showExtraField = true;
      extraFieldLabel = "Debit from account";
    } else if (
      (accName === "investment" && txnType === "debit") ||
      (type === "party" && txnType === "credit")
    ) {
      showExtraField = true;
      extraFieldLabel = "Credit to account";
    }
  }

  const handleUpdate = async () => {
    if (!form.accountId || !form.amount) return;

    await updateTransaction(user.uid, txnId, {
      ...form,
      amount: parseInt(form.amount),
      accountType: selectedAccount?.type,
      accountName: selectedAccount?.name,
    });

    navigate(-1);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f9fafc 0%, #eef3f7 100%)",
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <EditIcon sx={{ color: "primary.main", fontSize: 30 }} />
        <Typography
          variant="h5"
          fontWeight="600"
          sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }}
        >
          Edit Transaction
        </Typography>
      </Stack>

      {/* Form Card */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": { transform: "translateY(-3px)", boxShadow: 6 },
          maxWidth: 500,
          mx: "auto",
        }}
      >
        {/* Account Selection */}
        <TextField
          select
          fullWidth
          label="Account"
          value={form.accountId}
          onChange={(e) => setForm({ ...form, accountId: e.target.value })}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountBalanceWalletIcon color="primary" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="">Select account</MenuItem>
          {enabledAccounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Transaction Type Toggle */}
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, color: "text.secondary", fontWeight: 500 }}
        >
          Transaction Type
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant={form.type === "debit" ? "contained" : "outlined"}
            color="error"
            fullWidth
            startIcon={<SwapHorizIcon />}
            onClick={() => setForm({ ...form, type: "debit" })}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              py: 1,
              transition: "all 0.2s",
            }}
          >
            Debit
          </Button>

          <Button
            variant={form.type === "credit" ? "contained" : "outlined"}
            color="success"
            fullWidth
            startIcon={<SwapHorizIcon />}
            onClick={() => setForm({ ...form, type: "credit" })}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              py: 1,
              transition: "all 0.2s",
            }}
          >
            Credit
          </Button>
        </Stack>

        {/* Amount Field with ₹ Symbol */}
        <TextField
          label="Amount"
          type="number"
          fullWidth
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="h6" sx={{ color: "success.main" }}>
                  ₹
                </Typography>
              </InputAdornment>
            ),
          }}
        />

        {/* Note Field */}
        <TextField
          label="Note"
          fullWidth
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <NotesIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Conditional Extra Account */}
        {showExtraField && (
          <TextField
            select
            fullWidth
            label={extraFieldLabel}
            value={form.extraAccountId || ""}
            onChange={(e) =>
              setForm({ ...form, extraAccountId: e.target.value })
            }
            sx={{ mb: 2 }}
          >
            <MenuItem value="">None</MenuItem>
            {enabledAccounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* Update Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{
            mt: 1,
            py: 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
            fontSize: "1rem",
            background: "linear-gradient(135deg, #1976d2, #42a5f5)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            "&:hover": {
              background: "linear-gradient(135deg, #1565c0, #2196f3)",
              boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
            },
          }}
          onClick={handleUpdate}
        >
          Update Transaction
        </Button>
      </Paper>
    </Box>
  );
}
