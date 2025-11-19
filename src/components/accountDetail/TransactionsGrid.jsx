import React from "react";
import { Box, Typography } from "@mui/material";
import TransactionCard from "./TransactionCard";

export default function TransactionsGrid({ filteredTransactions, onEdit, onDelete }) {
  if (!filteredTransactions || filteredTransactions.length === 0) {
    return <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 5 }}>No transactions found 💭</Typography>;
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 1.5,
      }}
    >
      {filteredTransactions.map((t, index) => (
        <TransactionCard key={t.id} t={t} index={index} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </Box>
  );
}
