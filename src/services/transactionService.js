// transactionService.js
import {
   doc, updateDoc, getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { deleteDoc } from "firebase/firestore"; // ✅ at top

export async function addTransaction(userId, txn) {
  console.log(txn)
  const col = collection(db, "users", userId, "transactions");
  const payload = {
    ...txn,
    createdAt: txn.createdAt || serverTimestamp(),
  };

  const docRef = await addDoc(col, payload);

  // --- Update main account balance ---
  const accountRef = doc(db, "users", userId, "accounts", txn.accountId);
  const accountSnap = await getDoc(accountRef);

  if (accountSnap.exists()) {
    const account = accountSnap.data();
    let newBalance = account.balance ?? 0;

    if (txn.type === "credit") newBalance += txn.amount;
    else if (txn.type === "debit") newBalance -= txn.amount;

    await updateDoc(accountRef, { balance: newBalance });
  }

  // --- Update extra account if exists ---
  if (txn.extraAccountId) {
    const extraRef = doc(db, "users", userId, "accounts", txn.extraAccountId);
    const extraSnap = await getDoc(extraRef);
    if (extraSnap.exists()) {
      let extraBalance = extraSnap.data().balance ?? 0;

      const accountType = txn.accountType?.toLowerCase();
      const accountName = txn.accountName?.toLowerCase();
      const txnType = txn.type;

      /**
       * ✅ Corrected & Final Logic
       *
       * 1. Investment (by name):
       *    - Credit → extra account DEBITED (money goes out from bank)
       *    - Debit  → extra account CREDITED (money goes into bank)
       *
       * 2. Party (by type):
       *    - Credit → extra account CREDITED
       *    - Debit  → extra account DEBITED
       *
       * 3. Fund (by type):
       *    - Credit → extra account DEBITED
       */

      let updateType = null;

      if (accountName === "investment") {
        if (txnType === "credit") updateType = "debit"; // take from bank
        else if (txnType === "debit") updateType = "credit"; // return to bank
      } else if (accountType === "party") {
        if (txnType === "credit") updateType = "credit";
        else if (txnType === "debit") updateType = "debit";
      } else if (accountType === "fund" && txnType === "credit") {
        updateType = "debit";
      }

      if (updateType === "credit") extraBalance += txn.amount;
      else if (updateType === "debit") extraBalance -= txn.amount;

      await updateDoc(extraRef, { balance: extraBalance });
    }
  }

  return docRef.id;
}



export function listenToTransactions(userId, setTransactions) {
  if (!userId) return () => {};
  const col = collection(db, "users", userId, "transactions");
  const q = query(col, orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(items);
    },
    (err) => {
      console.error("listenToTransactions error:", err);
    }
  );
  return unsub;
}


// Get a single transaction
export async function getTransactionById(userId, txnId) {
  const docRef = doc(db, "users", userId, "transactions", txnId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Update transaction with correct balance adjustments
export async function updateTransaction(userId, txnId, updatedTxn) {
  const docRef = doc(db, "users", userId, "transactions", txnId);
  const oldSnap = await getDoc(docRef);
  if (!oldSnap.exists()) return;

  const oldTxn = oldSnap.data();

  // --- Revert old transaction from main account ---
  const mainAccountRef = doc(db, "users", userId, "accounts", oldTxn.accountId);
  const mainSnap = await getDoc(mainAccountRef);
  if (mainSnap.exists()) {
    let balance = mainSnap.data().balance ?? 0;
    balance -= oldTxn.type === "credit" ? oldTxn.amount : -oldTxn.amount;
    await updateDoc(mainAccountRef, { balance });
  }

  // --- Revert old transaction from extra account if exists ---
  if (oldTxn.extraAccountId) {
    const extraRef = doc(db, "users", userId, "accounts", oldTxn.extraAccountId);
    const extraSnap = await getDoc(extraRef);
    if (extraSnap.exists()) {
      let extraBalance = extraSnap.data().balance ?? 0;
      const accountType = oldTxn.accountType?.toLowerCase();
      const accountName = oldTxn.accountName?.toLowerCase();
      const txnType = oldTxn.type;

      let updateType = null;
      if (accountName === "investment") {
        updateType = txnType === "credit" ? "credit" : "debit";
      } else if (accountType === "party") {
        updateType = txnType === "credit" ? "debit" : "credit";
      } else if (accountType === "fund" && txnType === "credit") {
        updateType = "credit";
      }

      if (updateType === "credit") extraBalance += oldTxn.amount;
      else if (updateType === "debit") extraBalance -= oldTxn.amount;

      await updateDoc(extraRef, { balance: extraBalance });
    }
  }

  // --- Apply updated transaction to main account ---
  const newMainAccountRef = doc(db, "users", userId, "accounts", updatedTxn.accountId);
  const newMainSnap = await getDoc(newMainAccountRef);
  if (newMainSnap.exists()) {
    let balance = newMainSnap.data().balance ?? 0;
    balance += updatedTxn.type === "credit" ? updatedTxn.amount : -updatedTxn.amount;
    await updateDoc(newMainAccountRef, { balance });
  }

  // --- Apply updated transaction to extra account if exists ---
  if (updatedTxn.extraAccountId) {
    const extraRef = doc(db, "users", userId, "accounts", updatedTxn.extraAccountId);
    const extraSnap = await getDoc(extraRef);
    if (extraSnap.exists()) {
      let extraBalance = extraSnap.data().balance ?? 0;
      const accountType = updatedTxn.accountType?.toLowerCase();
      const accountName = updatedTxn.accountName?.toLowerCase();
      const txnType = updatedTxn.type;

      let updateType = null;

      if (accountName === "investment") {
        updateType = txnType === "credit" ? "debit" : "credit";
      } else if (accountType === "party") {
        updateType = txnType === "credit" ? "credit" : "debit";
      } else if (accountType === "fund" && txnType === "credit") {
        updateType = "debit";
      }

      if (updateType === "credit") extraBalance += updatedTxn.amount;
      else if (updateType === "debit") extraBalance -= updatedTxn.amount;

      await updateDoc(extraRef, { balance: extraBalance });
    }
  }

  // --- Update the transaction document itself ---
  await updateDoc(docRef, updatedTxn);
}

// --- Delete transaction and revert balances ---
export async function deleteTransaction(userId, txnId) {
  const docRef = doc(db, "users", userId, "transactions", txnId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const txn = snap.data();

  // --- Revert main account balance ---
  const mainAccountRef = doc(db, "users", userId, "accounts", txn.accountId);
  const mainSnap = await getDoc(mainAccountRef);
  if (mainSnap.exists()) {
    let balance = mainSnap.data().balance ?? 0;
    balance -= txn.type === "credit" ? txn.amount : -txn.amount;
    await updateDoc(mainAccountRef, { balance });
  }

  // --- Revert extra account if exists ---
  if (txn.extraAccountId) {
    const extraRef = doc(db, "users", userId, "accounts", txn.extraAccountId);
    const extraSnap = await getDoc(extraRef);
    if (extraSnap.exists()) {
      let extraBalance = extraSnap.data().balance ?? 0;
      const accountType = txn.accountType?.toLowerCase();
      const accountName = txn.accountName?.toLowerCase();
      const txnType = txn.type;

      let updateType = null;

      // Mirror the logic from addTransaction (reverse of what was applied)
      if (accountName === "investment") {
        // addTransaction did: credit → debit, debit → credit
        // so here we reverse that same effect
        if (txnType === "credit") updateType = "credit";
        else if (txnType === "debit") updateType = "debit";
      } else if (accountType === "party") {
        // addTransaction did: credit → credit, debit → debit
        if (txnType === "credit") updateType = "debit";
        else if (txnType === "debit") updateType = "credit";
      } else if (accountType === "fund" && txnType === "credit") {
        updateType = "credit";
      }

      if (updateType === "credit") extraBalance += txn.amount;
      else if (updateType === "debit") extraBalance -= txn.amount;

      await updateDoc(extraRef, { balance: extraBalance });
    }
  }

  // --- Finally delete the transaction document ---
  await deleteDoc(docRef);
}