// src/pages/ImportTransactionsPage.jsx
import React, { useState } from "react";
import { Button, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import Papa from "papaparse";
import { addAccount } from "../services/accountService";
import { addTransaction } from "../services/transactionService";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function ImportTransactionsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [accountType, setAccountType] = useState("Asset");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Parsing CSV...");
    const data = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });

    // --- 1. Fetch existing accounts once ---
    setStatus("Fetching existing accounts...");
    const col = collection(db, "users", user.uid, "accounts");
    const q = query(col, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    const existingAccounts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // --- 2. Build category -> accountId map ---
    const accountMap = {};
    const categories = [...new Set(data.map(d => d.Category))];

    setStatus("Checking/creating accounts...");
    for (const cat of categories) {
      const acc = existingAccounts.find(a => a.name.toLowerCase() === cat.toLowerCase());
      if (acc) {
        accountMap[cat] = acc.id;
      } else {
        const newId = await addAccount(user.uid, { name: cat, type: accountType, balance: 0 });
        accountMap[cat] = newId;
        existingAccounts.push({ id: newId, name: cat, type: accountType, balance: 0 });
      }
    }

    // --- 3. Add transactions ---
    setStatus("Adding transactions...");
    let counter = 0;
    for (const row of data) {
      const accountId = accountMap[row.Category];
      if (!accountId) continue;

      const amountIn = parseFloat(row["Cash In"] || 0);
      const amountOut = parseFloat(row["Cash Out"] || 0);
      const txnType = amountIn > 0 ? "credit" : "debit";
      const amount = amountIn > 0 ? amountIn : amountOut;

      const txn = {
        accountId,
        type: txnType,
        amount,
        note: row.Remark || "",
        createdAt: new Date(`${row.Date} ${row.Time}`),
        accountName: row["Category"],
      };

      await addTransaction(user.uid, txn);
      counter++;
      setStatus(`Imported ${counter}/${data.length} transactions...`);
    }

    setStatus(`✅ Done! Imported ${counter} transactions.`);
  };

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h6">Import Transactions CSV</Typography>

      <FormControl style={{ marginTop: 20, minWidth: 150 }}>
        <InputLabel>New Account Type</InputLabel>
        <Select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <MenuItem value="Asset">Asset</MenuItem>
          <MenuItem value="Party">Party</MenuItem>
          <MenuItem value="Fund">Fund</MenuItem>
        </Select>
      </FormControl>

      <div style={{ marginTop: 20 }}>
        <input type="file" accept=".csv" onChange={handleFile} />
      </div>

      <Typography style={{ marginTop: 20 }}>{status}</Typography>
    </div>
  );
}
