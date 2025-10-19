import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Fab,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import finzaarLogo from "../assets/fundflare-logo.png";
import finzaarLogoWhite from "../assets/fundflare-logo-white.png";

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { label: "Accounts", icon: <AccountBalanceIcon />, path: "/dashboard/accounts" },
  { label: "Transactions", icon: <ReceiptIcon />, path: "/dashboard/transactions" },
  { label: "Import Cashbook Transactions", icon: <ReceiptIcon />, path: "/dashboard/import-transactions" },
  
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md")); // ≥ md = desktop

  const [drawerOpen, setDrawerOpen] = useState(isDesktop);
  const [bottomValue, setBottomValue] = useState(0);

  // Update drawerOpen on desktop/mobile switch
  useEffect(() => {
    setDrawerOpen(isDesktop);
  }, [isDesktop]);

  // Active bottom nav index
  useEffect(() => {
    const idx = navItems.findIndex(
      (n) =>
        location.pathname === n.path || location.pathname.startsWith(n.path + "/")
    );
    setBottomValue(idx === -1 ? 0 : idx);
  }, [location.pathname]);

  const handleNavClick = (path) => {
    navigate(path);
    if (!isDesktop) setDrawerOpen(false); // close drawer on mobile
  };

  // Bottom navigation height (approximate)
  const bottomNavHeight = 56;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar position="fixed">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {!isDesktop && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box
              component="img"
              src={finzaarLogoWhite}
              alt="FundFlare"
              sx={{
                height: 48,
                width: "auto",
                ml: !isDesktop ? 1 : 2,
              }}
            />
            <Typography variant="h5" sx={{ ml: 1 }}>FundFlare</Typography>
          </Box>

          {user && <Avatar src={user.photoURL} alt={user.displayName} />}
        </Toolbar>
      </AppBar>

      {/* Sidebar drawer */}
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
            mt: "64px", // AppBar height
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: "left" }}>
          <Box
            component="img"
            src={finzaarLogo}
            alt="logo"
            sx={{ width: "80%", maxWidth: 140 }}
          />
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={() => handleNavClick(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: "64px",
          ml: isDesktop ? "260px" : 0,
          p: 2,
          // Space for bottom nav on mobile
          mb: !isDesktop ? `${bottomNavHeight }px` : 0,
          minHeight: `calc(100vh - 64px - ${bottomNavHeight}px)`,
        }}
      >
        <Outlet />
      </Box>


      {/* Bottom nav only on mobile */}
      {!isDesktop && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={bottomValue}
            onChange={(e, newValue) => handleNavClick(navItems[newValue].path)}
          >
            {navItems.filter(item => item.path != '/dashboard/import-transactions').map((item) => (
              <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
