import React from "react";
import { Paper, Stack, Box, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * TransactionCard
 *
 * Color logic:
 * - If this card represents the primary account (t.accountId === currentAccountId),
 *   color is based on t.type (credit -> green, debit -> red).
 * - If this card represents the secondary account (t.extraAccountId === currentAccountId),
 *   we compute the updateType for the extra account using the same rules as transactionService.
 *   Then color is based on that updateType (credit -> green, debit -> red).
 */

export default function TransactionCard({ t, index, currentAccountId, accountsMap, onEdit, onDelete }) {
  // Helper: compute what update (credit/debit/null) was applied to the extra account
  function computeExtraUpdateType(txn) {
    if (!txn) return null;
    const accountType = txn.accountType?.toLowerCase(); // expected to describe extra account type
    const accountName = txn.accountName?.toLowerCase(); // expected to describe extra account name (e.g., "investment")
    const txnType = txn.type; // "credit" or "debit"

    // Follow the same rules from transactionService.addTransaction / updateTransaction
    // 1) investment (by name):
    //    - txnType === "credit"  => extra was "debit"   (money taken from bank)
    //    - txnType === "debit"   => extra was "credit"  (money returned to bank)
    // 2) party (by type):
    //    - txnType === "credit"  => extra was "credit"
    //    - txnType === "debit"   => extra was "debit"
    // 3) fund (by type):
    //    - txnType === "credit"  => extra was "debit"
    // Other cases => unknown (null)

    if (accountName === "investment") {
      if (txnType === "credit") return "debit";
      if (txnType === "debit") return "credit";
      return null;
    }

    if (accountType === "party") {
      if (txnType === "credit") return "credit";
      if (txnType === "debit") return "debit";
      return null;
    }

    if (accountType === "fund" && txnType === "credit") {
      return "debit";
    }

    return null;
  }

  // Determine whether this card is primary / secondary / other
  const isPrimary = currentAccountId && t.accountId === currentAccountId;
  const isSecondary = currentAccountId && t.extraAccountId === currentAccountId;
  const entryType = isPrimary ? "Primary" : isSecondary ? "Secondary" : "Other";

  // For primary, we keep original logic: credit => green, debit => red
  // For secondary, compute the effect on extra account and use that to choose color
  const extraUpdateType = isSecondary ? computeExtraUpdateType(t) : null;

  // Decide whether to treat as "credit" for colouring purposes
  // priority: if secondary and extraUpdateType known -> use that
  // else fallback to t.type (original)
  const effectiveIsCredit = (() => {
    if (isSecondary && extraUpdateType) {
      return extraUpdateType === "credit";
    }
    return t.type === "credit";
  })();

  const bgColor = effectiveIsCredit
    ? "linear-gradient(135deg, #e8f5e9, #c8e6c9)"
    : "linear-gradient(135deg, #ffebee, #ffcdd2)";

  const textColor = effectiveIsCredit ? "success.main" : "error.main";

  const chipStyles = {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "6px",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: isPrimary ? "#1b5e20" : "#0d47a1",
    backgroundColor: isPrimary ? "rgba(76,175,80,0.15)" : "rgba(33,150,243,0.15)",
    marginTop: "4px",
  };

  // Determine primary account name (transaction.accountId is treated as primary)
  const primaryAccountId = t.accountId;
  const primaryName = accountsMap?.[primaryAccountId]?.name || primaryAccountId;

  // Build remark: if this card is secondary, append "(PrimaryName)" to remark
  // Example: original note "Borrowed" -> "Borrowed(Saiyad)"
  const rawNote = t.note || "";
  const displayRemark = isSecondary
    ? (rawNote ? `${rawNote} (${primaryName})` : `(${primaryName})`)
    : rawNote;

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
          borderLeft: `5px solid ${effectiveIsCredit ? "#2e7d32" : "#c62828"}`,
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
            {/* Amount */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color={textColor}
              sx={{ lineHeight: 1.1 }}
            >
              ₹{Number(t.amount).toLocaleString()}
            </Typography>

            {/* Note / Remark */}
            {displayRemark ? (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.3,
                  fontStyle: "italic",
                  color: "text.secondary",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                }}
              >
                📝 {displayRemark}
              </Typography>
            ) : null}

            {/* Date */}
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

            {/* 🔰 Primary / Secondary Badge */}
            <Typography sx={chipStyles}>
              {entryType}
            </Typography>
          </Box>

          {/* Action Buttons */}
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
