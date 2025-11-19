import React from "react";
import { Paper, Stack, Box, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function TransactionCard({ t, index, onEdit, onDelete }) {
  const isCredit = t.type === "credit";
  const bgColor = isCredit
    ? "linear-gradient(135deg, #e8f5e9, #c8e6c9)"
    : "linear-gradient(135deg, #ffebee, #ffcdd2)";
  const textColor = isCredit ? "success.main" : "error.main";

  return (
    <Box
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
          borderLeft: `5px solid ${isCredit ? "#2e7d32" : "#c62828"}`,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color={textColor} sx={{ lineHeight: 1.1 }}>
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
              sx={{ color: textColor, p: 0.5, "&:hover": { bgcolor: "rgba(0,0,0,0.05)" } }}
              onClick={() => onEdit(t.id)}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              sx={{ color: "error.main", p: 0.5, "&:hover": { bgcolor: "rgba(255,0,0,0.08)" } }}
              onClick={() => onDelete(t.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
