import React from "react";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function AddTransactionFab({ onClick }) {
  return (
    <Fab
      color="primary"
      aria-label="add"
      onClick={onClick}
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
  );
}
