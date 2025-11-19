// TransactionsListMobile.jsx
import React from "react";
import { Box, Paper, Typography, Grid, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { fmt } from "./pdfExport"; // reuse your fmt helper (adjust import path if needed)

export default function TransactionsListMobile({ filteredTransactions = [], onEdit, onDelete }) {
  if (!filteredTransactions || filteredTransactions.length === 0) {
    return (
      <Box mt={2}>
        <Typography variant="body2" color="textSecondary">No transactions to show</Typography>
      </Box>
    );
  }

  return (
    <Box mt={2} display="flex" flexDirection="column" gap={1}>
      {filteredTransactions.map((t) => {
        const dateObj = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        const dateStr = dateObj.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "2-digit" });
        const note = t.note || t.remark || t.description || "-";
        const isCredit = (t.type || "").toLowerCase() === "credit";
        const amount = Number(t.amount || 0);

        return (
          <Paper key={t.id} elevation={1} sx={{ p: 1.25 }}>
            <Grid container alignItems="center" spacing={1}>
              <Grid item xs={7}>
                <Typography variant="subtitle2">{dateStr} • {t.category || "-"}</Typography>
                <Typography variant="body2" sx={{ mt: 0.25 }}>{note}</Typography>
              </Grid>

              <Grid item xs={3} textAlign="right">
                <Typography variant="subtitle1" sx={{ color: isCredit ? "success.main" : "error.main", fontWeight: 700 }}>
                  {isCredit ? "₹ " : "₹ "}{fmt(amount)}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {isCredit ? "Cash in" : "Cash out"}
                </Typography>
              </Grid>

              <Grid item xs={2} textAlign="right">
                <IconButton size="small" onClick={() => onEdit && onEdit(t.id)} aria-label="edit">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete && onDelete(t.id)} aria-label="delete">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        );
      })}
    </Box>
  );
}
