import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Button,
  useMediaQuery,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { listenToTransactions, deleteTransaction } from "../services/transactionService";
import { getAccountById, listenToAccounts } from "../services/accountService";
import { useAuth } from "../context/AuthContext";

import AccountHeader from "../components/accountDetail/AccountHeader";
import FiltersPanel from "../components/accountDetail/FiltersPanel";
import TransactionsGrid from "../components/accountDetail/TransactionsGrid";
import AddTransactionFab from "../components/accountDetail/AddTransactionFab";

import { exportAccountStatement } from "../components/accountDetail/pdfExport";
import PdfViewer from "../components/accountDetail/PdfViewer";

export default function AccountDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [account, setAccount] = useState(null);
  const [accounts, setAccounts] = useState([]); // new: all accounts list
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // PDF viewer / exporting
  const [exporting, setExporting] = useState(false);
  const [pdfResult, setPdfResult] = useState(null); // { blob, filename }
  const [viewerOpen, setViewerOpen] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });

  useEffect(() => {
    if (!user) return;

    // fetch account once
    getAccountById(user.uid, id).then((acct) => setAccount(acct)).catch((err) => {
      console.error("Failed to load account:", err);
      setSnack({ open: true, severity: "error", message: "Failed to load account" });
    });

    // listen to transactions
    const unsubTx = listenToTransactions(user.uid, (allTxns) => {
      const filtered = (allTxns || [])
        .filter((t) => t.accountId === id || t.extraAccountId === id)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); // newest first in UI
      setTransactions(filtered);
      setFilteredTransactions(filtered);
    });

    // listen to accounts so we can show account names (used when showing counterparty/primary name)
    const unsubAcc = listenToAccounts(user.uid, (items) => {
      setAccounts(items || []);
    });

    return () => {
      unsubTx && unsubTx();
      unsubAcc && unsubAcc();
    };
  }, [user, id]);

  // map of accounts for quick lookup
  const accountsMap = useMemo(() => {
    const m = {};
    (accounts || []).forEach((a) => {
      if (a && a.id) m[a.id] = a;
    });
    return m;
  }, [accounts]);

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...transactions];
    if (fromDate) {
      const fd = new Date(fromDate);
      filtered = filtered.filter((t) => t.createdAt?.toDate() >= fd);
    }
    if (toDate) {
      const td = new Date(toDate);
      td.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => t.createdAt?.toDate() <= td);
    }
    if (month) {
      const m = parseInt(month, 10);
      filtered = filtered.filter((t) => t.createdAt?.toDate().getMonth() + 1 === m);
    }
    if (year) {
      const y = parseInt(year, 10);
      filtered = filtered.filter((t) => t.createdAt?.toDate().getFullYear() === y);
    }
    setFilteredTransactions(filtered);
  }, [fromDate, toDate, month, year, transactions]);

  // Helpers for filter dropdowns
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(new Set(transactions.map((t) => t.createdAt?.toDate().getFullYear())))
    .filter(Boolean)
    .sort((a, b) => b - a);

  // Transaction actions
  const handleAddTransaction = () => {
    navigate(`/dashboard/transactions/add/${id}`, {
      state: { preselectedAccountId: id },
    });
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteTransaction(user.uid, txnId);
      setSnack({ open: true, severity: "success", message: "Transaction deleted" });
    } catch (err) {
      console.error("Delete failed:", err);
      setSnack({ open: true, severity: "error", message: "Failed to delete transaction" });
    }
  };

  // Export -> generate blob and open viewer
  const handleExportPDF = async () => {
    if (!account) {
      setSnack({ open: true, severity: "warning", message: "Account not loaded yet" });
      return;
    }
    try {
      setExporting(true);
      const result = await exportAccountStatement({ account, filteredTransactions, user });
      if (result && result.blob) {
        setPdfResult(result);
        setViewerOpen(true);
      } else {
        console.warn("exportAccountStatement returned no blob");
        setSnack({ open: true, severity: "error", message: "Failed to prepare statement" });
      }
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setSnack({ open: true, severity: "error", message: "Failed to generate statement" });
    } finally {
      setExporting(false);
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
      {/* Header */}
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "stretch" : "center"}
        mb={2}
        spacing={isMobile ? 1 : 0}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptLongIcon sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.15rem", sm: "1.5rem" },
            }}
          >
            Transactions
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: isMobile ? 1 : 0,
            alignSelf: isMobile ? "flex-start" : "auto",
            flexWrap: "wrap",
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => setShowFilters((prev) => !prev)}
            sx={{ textTransform: "none" }}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={
              exporting ? (
                <CircularProgress size={18} thickness={5} />
              ) : (
                <ReceiptLongIcon />
              )
            }
            onClick={handleExportPDF}
            sx={{ textTransform: "none" }}
            disabled={exporting}
          >
            {exporting ? "Preparing..." : "View Statement"}
          </Button>
        </Box>
      </Stack>

      {/* Account header */}
      <AccountHeader account={account} isMobile={isMobile} />

      {/* Filters */}
      <FiltersPanel
        showFilters={showFilters}
        isMobile={isMobile}
        fromDate={fromDate}
        toDate={toDate}
        month={month}
        year={year}
        setFromDate={setFromDate}
        setToDate={setToDate}
        setMonth={setMonth}
        setYear={setYear}
        months={months}
        years={years}
      />

      {/* Transactions list */}
      <TransactionsGrid
        filteredTransactions={filteredTransactions}
        currentAccountId={id}
        accountsMap={accountsMap}
        onEdit={(txnId) => navigate(`/dashboard/transactions/edit/${txnId}`)}
        onDelete={handleDeleteTransaction}
      />

      {/* Floating add button */}
      <AddTransactionFab onClick={handleAddTransaction} />

      {/* Pdf Viewer Dialog */}
      <PdfViewer
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          // free blob if you want
          setPdfResult(null);
        }}
        pdfResult={pdfResult}
      />

      {/* Snackbar for quick messages */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
