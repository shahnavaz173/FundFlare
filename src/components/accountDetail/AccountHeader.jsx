import React from "react";
import { Paper, Box, Typography, Avatar } from "@mui/material";

// Icons
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"; // Asset
import PersonIcon from "@mui/icons-material/Person";                 // Party
import SavingsIcon from "@mui/icons-material/Savings";               // Fund (reserved)

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AccountHeader({ account = {}, isMobile = false }) {
  const bal = Number(account?.balance ?? 0);

  // Normalize account type
  const type = (account?.type || "").trim().toLowerCase();

  // Map the 3 account types to icons
  const iconMap = {
    asset: (
      <AccountBalanceIcon
        sx={{ fontSize: isMobile ? 20 : 28, color: "primary.main" }}
      />
    ),
    party: (
      <PersonIcon
        sx={{ fontSize: isMobile ? 20 : 28, color: "primary.main" }}
      />
    ),
    fund: (
      <SavingsIcon
        sx={{ fontSize: isMobile ? 20 : 28, color: "primary.main" }}
      />
    ),
  };

  // Fallback icon (only used if type is unknown)
  const icon = iconMap[type] ?? (
    <AccountBalanceIcon
      sx={{ fontSize: isMobile ? 20 : 28, color: "primary.main" }}
    />
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1 : 2,
        mb: 2,
        borderRadius: 2,
        background: isMobile
          ? "linear-gradient(90deg,#f5fbff,#eff7ff)"
          : "linear-gradient(90deg,#eef8ff,#f6fbff)",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        sx={{
          flexWrap: "wrap", // allow wrapping on very small screens
        }}
      >
        <Avatar
          sx={{
            width: isMobile ? 44 : 64,
            height: isMobile ? 44 : 64,
            bgcolor: "transparent",
            border: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: isMobile ? 0.5 : 1,
            flex: "0 0 auto",
          }}
        >
          {icon}
        </Avatar>

        <Box flex="1 1 0" minWidth={0}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: isMobile ? "0.95rem" : "1.25rem",
              lineHeight: 1.1,
            }}
            noWrap
            title={account?.name}
          >
            {account?.name ?? "Account"}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {capitalize(account?.type)}
          </Typography>
        </Box>

        <Box
          textAlign="right"
          sx={{
            minWidth: 90,
            flex: "0 0 auto",
            ml: isMobile ? "auto" : 0, // ensure it sits to the right on small widths
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: isMobile ? "0.95rem" : "1.25rem",
              color: bal < 0 ? "error.main" : "success.main",
            }}
          >
            ₹{Intl.NumberFormat("en-IN").format(bal)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
