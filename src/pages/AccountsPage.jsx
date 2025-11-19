import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Collapse,
  Paper,
  Fab,
  Button,
  Divider,
  Fade,
  useMediaQuery,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, FilterList, Block, Undo } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { listenToAccounts, toggleAccountDisabled } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (!user) return;
    const unsub = listenToAccounts(user.uid, setAccounts);
    return () => unsub && unsub();
  }, [user]);

  // Separate active and disabled accounts
  const activeAccounts = accounts
    .filter((a) => !a.disabled)
    .filter((a) => {
      const matchesName = a.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesType = filterType ? a.type === filterType : true;
      return matchesName && matchesType;
    });

  const disabledAccounts = accounts
    .filter((a) => a.disabled)
    .filter((a) => {
      const matchesName = a.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesType = filterType ? a.type === filterType : true;
      return matchesName && matchesType;
    });

  // Combine for display (active first, then disabled)
  const displayedAccounts = [...activeAccounts, ...disabledAccounts];

  return (
    <Box
      sx={{
        pb: { xs: 10, sm: 2 },
        px: { xs: 2, sm: 4 },
        position: "relative",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} mt={1}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
        >
          💼 Accounts
        </Typography>
        <Button
          startIcon={<FilterList />}
          variant="outlined"
          onClick={() => setShowFilters((prev) => !prev)}
          sx={{
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.9rem" },
            px: { xs: 1, sm: 2 },
            py: { xs: 0.3, sm: 0.7 },
          }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </Stack>

      {/* Filters Section */}
      <Collapse in={showFilters}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1.5, sm: 3 },
            mb: 3,
            borderRadius: 3,
            backgroundColor: "#fff",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
          >
            <TextField
              label="🔍 Search by name"
              variant="outlined"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              fullWidth
              size={isMobile ? "small" : "medium"}
            />
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Account Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Asset">Asset</MenuItem>
                <MenuItem value="Party">Party</MenuItem>
                <MenuItem value="Fund">Fund</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>
      </Collapse>

      <Divider sx={{ mb: 2 }} />

      {/* Account List */}
      <Fade in>
        <Stack spacing={isMobile ? 1.2 : 2}>
          {displayedAccounts.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                textAlign: "center",
                py: 8,
                color: "text.secondary",
                background: "transparent",
              }}
            >
              <Typography variant="h6" gutterBottom>
                No Accounts Found 😕
              </Typography>
              <Typography variant="body2">
                Try adjusting your filters or create a new account.
              </Typography>
            </Paper>
          ) : (
            displayedAccounts.map((a, idx) => (
              <Card
                key={a.id}
                elevation={3}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  background: a.disabled
                    ? "linear-gradient(145deg, #f5f5f5, #e0e0e0)"
                    : "linear-gradient(145deg, #ffffff, #f0f4f8)",
                  opacity: a.disabled ? 0.6 : 1,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 1.2, sm: 2 },
                    "&:last-child": { pb: { xs: 1.2, sm: 2 } },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box onClick={() => navigate(`/dashboard/accounts/${a.id}`)}>
                      <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{ fontWeight: 600 }}
                      >
                        {a.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.9rem" } }}
                      >
                        Type: {a.type}
                        {a.disabled && " • Disabled"}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant={isMobile ? "body2" : "subtitle1"}
                        sx={{
                          fontWeight: 600,
                          color: a.balance >= 0 ? "success.main" : "error.main",
                        }}
                      >
                        ₹ {a.balance?.toLocaleString() ?? 0}
                      </Typography>
                      <Tooltip title={a.disabled ? "Enable Account" : "Disable Account"}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAccountDisabled(user.uid, a.id, !a.disabled);
                          }}
                        >
                          {a.disabled ? <Undo color="success" /> : <Block color="error" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Fade>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 70,
          right: 24,
          boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
        }}
        onClick={() => navigate("/dashboard/accounts/add")}
      >
        <AddIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
      </Fab>
    </Box>
  );
}
