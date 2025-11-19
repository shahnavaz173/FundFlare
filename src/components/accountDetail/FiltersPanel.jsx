import React from "react";
import { Paper, Typography, Stack, TextField, MenuItem, Collapse } from "@mui/material";

export default function FiltersPanel({
  showFilters,
  isMobile,
  fromDate,
  toDate,
  month,
  year,
  setFromDate,
  setToDate,
  setMonth,
  setYear,
  months,
  years,
}) {
  // Preserve original behaviour: collapse when showFilters is false AND isMobile is true
  const open = showFilters || !isMobile;

  return (
    <Collapse in={open}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Filter Transactions
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
          <TextField
            label="From"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Month"
            size="small"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            sx={{ flex: 1 }}
          >
            <MenuItem value="">All</MenuItem>
            {months.map((m) => (
              <MenuItem key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Year"
            size="small"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{ flex: 1 }}
          >
            <MenuItem value="">All</MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>
    </Collapse>
  );
}
