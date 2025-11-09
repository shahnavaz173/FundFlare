import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export async function addAccount(userId, account) {
  const col = collection(db, "users", userId, "accounts");
  const payload = {
    ...account,
    type: account.type || "Asset",
    createdAt: account.createdAt || serverTimestamp(),
    disabled: account.disabled || false, // ✅ new field
  };
  const docRef = await addDoc(col, payload);
  return docRef.id;
}

export function listenToAccounts(userId, setAccounts) {
  if (!userId) return () => {};
  const col = collection(db, "users", userId, "accounts");
  const q = query(col, orderBy("createdAt", "asc"));
  const unsub = onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAccounts(items);
    },
    (err) => {
      console.error("listenToAccounts error:", err);
    }
  );
  return unsub;
}

// ✅ new helper: enable/disable account
export async function toggleAccountDisabled(userId, accountId, disabled) {
  if (!userId || !accountId) return;
  try {
    const ref = doc(db, "users", userId, "accounts", accountId);
    await updateDoc(ref, { disabled });
  } catch (err) {
    console.error("toggleAccountDisabled error:", err);
  }
}

export function calculateSummary(accounts) {
  const assets = accounts.filter(a => a.type === "Asset");
  const funds = accounts.filter(a => a.type === "Fund");
  const parties = accounts.filter(a => a.type === "Party");

  const sum = arr => arr.reduce((acc, a) => acc + (a.balance || 0), 0);

  const totalToTakeFromParties = parties
    .filter(a => a.balance < 0)
    .reduce((acc, a) => acc + Math.abs(a.balance), 0);

  const totalToPayToParties = parties
    .filter(a => a.balance > 0)
    .reduce((acc, a) => acc + a.balance, 0);

  const totalEverything = sum(assets) + sum(funds) + totalToTakeFromParties;
  const totalExcludingFunds = sum(assets) + totalToTakeFromParties;

  const investmentAcc = assets.find(a => a.name.toLowerCase() === "investment");
  const investmentOnly = investmentAcc ? investmentAcc.balance : 0;

  const cashAcc = assets.filter(a => ["bank", "cash"].includes(a.name.toLowerCase()));
  const cashBalance = sum(cashAcc);

  const totalFunds = sum(funds);

  return {
    totalEverything,
    totalExcludingFunds,
    investmentOnly,
    cashBalance,
    totalToTakeFromParties,
    totalToPayToParties,
    totalFunds,
  };
}

export async function createDefaultAccounts(userId) {
  const defaultAccounts = [
    { name: "Cash", type: "Asset", balance: 0, createdAt: new Date() },
    { name: "Bank", type: "Asset", balance: 0, createdAt: new Date() },
    { name: "Investment", type: "Asset", balance: 0, createdAt: new Date() },
  ];

  for (const account of defaultAccounts) {
    await addAccount(userId, account);
  }
}

export async function getAccountById(userId, accountId) {
  if (!userId || !accountId) return null;
  try {
    const ref = doc(db, "users", userId, "accounts", accountId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("getAccountById error:", err);
    return null;
  }
}
