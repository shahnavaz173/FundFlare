// src/components/accountDetail/pdfExport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Safe currency label to avoid glyph issues in PDF fonts.
export const CURRENCY = "Rs";

// Remove invisible/directional/control characters and normalize
export const sanitize = (value = "") => {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFKC")
    .replace(/[\uFEFF\u00A0\u200B\u200C\u200D\u200E\u200F]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
};

// Format numbers to en-IN and strip NBSP if present
export const fmt = (num) => {
  const n = Number(num || 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n).replace(/\u00A0/g, "");
};

// Helper to format date like "05 Oct 23"
const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  } catch {
    return "-";
  }
};

async function loadImageDataUrl(url) {
  if (!url) throw new Error("No URL");
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch image");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    throw err;
  }
}

/**
 * Compute effective update type ("credit"/"debit") for viewedAccountId.
 * Mirrors transactionService logic.
 */
function computeEffectiveTypeForAccount(txn, viewedAccountId) {
  if (!txn || !viewedAccountId) return (txn?.type || null);

  // If viewed account is the primary (txn.accountId), effect is txn.type
  if (txn.accountId === viewedAccountId) {
    return (txn.type || "").toLowerCase();
  }

  // If viewed account is the extra (secondary) account, compute effect on it
  if (txn.extraAccountId === viewedAccountId) {
    const accountType = (txn.accountType || "").toLowerCase();
    const accountName = (txn.accountName || "").toLowerCase();
    const txnType = (txn.type || "").toLowerCase();

    if (accountName === "investment") {
      // addTransaction: credit -> extra debit, debit -> extra credit
      if (txnType === "credit") return "debit";
      if (txnType === "debit") return "credit";
      return txnType || null;
    }

    if (accountType === "party") {
      // addTransaction: credit -> extra credit, debit -> extra debit
      if (txnType === "credit") return "credit";
      if (txnType === "debit") return "debit";
      return txnType || null;
    }

    if (accountType === "fund" && txnType === "credit") {
      // addTransaction: credit -> extra debit
      return "debit";
    }

    // fallback to txn.type
    return txnType || null;
  }

  // Not related to viewed account — fallback
  return (txn.type || "").toLowerCase();
}

/**
 * Export account statement to PDF and return a Blob (no direct download).
 * Returns: { blob: Blob, filename: string }
 *
 * Options: { account, filteredTransactions, user, logoPath }
 */
export async function exportAccountStatement({
  account,
  filteredTransactions = [],
  user = {},
  logoPath = "/assets/fundflare-logo-only-dark.png",
}) {
  if (!account) return null;

  const viewedAccountId = account.id || account.accountId || null;
  const acctName = sanitize(account.name || "Account");
  const acctType = sanitize(account.type || "-");

  // Build txns with the fields we need
  const txns = [...filteredTransactions]
    .map((t) => ({
      id: t.id,
      dateObj: t.createdAt?.toDate ? t.createdAt.toDate() : new Date(),
      remark: sanitize(t.note || t.remark || t.description || "-"),
      // category removed intentionally (user requested)
      type: (t.type || "").toLowerCase(),
      amount: Number(t.amount || 0),
      accountId: t.accountId || null,         // primary account id
      extraAccountId: t.extraAccountId || null, // secondary account id
      accountType: t.accountType || null,     // type info (for extra logic)
      accountName: t.accountName || null,     // primary account name (used for remark)
    }))
    .sort((a, b) => a.dateObj - b.dateObj); // oldest first

  // Compute effective type for viewed account and adjust remark when viewed is secondary
  const txnsWithEffective = txns.map((t) => {
    const effectiveType = computeEffectiveTypeForAccount(t, viewedAccountId);

    // Determine display remark:
    // If viewed account is the secondary (extraAccountId === viewedAccountId),
    // append primary account name (from txn.accountName or fallback to id).
    const isSecondaryView = t.extraAccountId === viewedAccountId;
    const primaryName = t.accountName || t.accountId || "";
    const baseRemark = t.remark || "";
    const displayRemark = isSecondaryView
      ? (baseRemark ? `${baseRemark} (${primaryName})` : `(${primaryName})`)
      : baseRemark;

    return { ...t, effectiveType, displayRemark };
  });

  // Totals based on effective types
  const totalCashIn = txnsWithEffective
    .filter((t) => t.effectiveType === "credit")
    .reduce((s, t) => s + t.amount, 0);

  const totalCashOut = txnsWithEffective
    .filter((t) => t.effectiveType === "debit")
    .reduce((s, t) => s + t.amount, 0);

  const firstRemark = txnsWithEffective[0]?.displayRemark?.toLowerCase() ?? "";
  const hasOpeningMarker = firstRemark.includes("balance") || firstRemark.includes("opening");
  const netChange = totalCashIn - totalCashOut;

  const closingBalanceProvided = typeof account.balance !== "undefined" && account.balance !== null;
  const closingBalance = Number(account.balance ?? (totalCashIn - totalCashOut));

  let openingBalance = 0;
  if (hasOpeningMarker) {
    openingBalance = 0;
  } else if (closingBalanceProvided) {
    openingBalance = Number((closingBalance - netChange).toFixed(2));
  } else {
    openingBalance = 0;
  }

  // Build table rows using effectiveType for balance calculations
  let running = openingBalance;
  const tableRows = txnsWithEffective.map((t, idx) => {
    const debit = t.effectiveType === "debit" ? t.amount : 0;
    const credit = t.effectiveType === "credit" ? t.amount : 0;
    running = Number((running + credit - debit).toFixed(2));
    return {
      idx: idx + 1,
      date: fmtDate(t.dateObj),
      remark: t.displayRemark,
      cashIn: credit,
      cashOut: debit,
      balance: running,
    };
  });

  if (tableRows.length === 0) {
    tableRows.push({
      idx: 1,
      date: "-",
      remark: "No transactions in the selected range",
      cashIn: 0,
      cashOut: 0,
      balance: openingBalance,
    });
  }

  // Create jsPDF doc
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = { left: 40, right: 40, top: 48, bottom: 48 };
  const generatedOn = new Date().toLocaleString();

  // Attempt to load logo (non-blocking if fails)
  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageDataUrl(logoPath);
  } catch (err) {
    logoDataUrl = null;
  }

  const body = tableRows.map((r) => [
    r.date,
    r.remark,
    r.cashIn > 0 ? `${CURRENCY} ${fmt(r.cashIn)}` : "-",
    r.cashOut > 0 ? `${CURRENCY} ${fmt(r.cashOut)}` : "-",
    `${CURRENCY} ${fmt(r.balance)}`,
  ]);

  const tableStartY = 170;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Date", "Remark", "Cash in", "Cash out", "Balance"]],
    body,
    styles: {
      fontSize: 10,
      cellPadding: 6,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [245, 245, 250],
      textColor: 40,
      halign: "center",
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70 },  // Date
      1: { cellWidth: 300 }, // Remark (wider now)
      2: { cellWidth: 80, halign: "right" }, // Cash in
      3: { cellWidth: 80, halign: "right" }, // Cash out
      4: { cellWidth: 90, halign: "right" }, // Balance
    },
    margin: { left: margin.left, right: margin.right, top: tableStartY, bottom: margin.bottom },
    didParseCell: function (data) {
      if (data.section === "body") {
        const colIdx = data.column.index;
        const cellText = data.cell.text && data.cell.text[0] ? String(data.cell.text[0]) : "";
        if (colIdx === 2 && cellText !== "-") {
          data.cell.styles.textColor = [11, 150, 83]; // green
        } else if (colIdx === 3 && cellText !== "-") {
          data.cell.styles.textColor = [219, 68, 55]; // red
        } else if (colIdx === 4) {
          data.cell.styles.textColor = [40, 40, 40];
        }
      }
    },
    didDrawPage: function (data) {
      const left = margin.left;
      const right = pageWidth - margin.right;

      // Header area: draw logo (if available) or fallback small rounded rect
      const logoX = left;
      const logoY = 20;
      const logoSize = 38;

      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, logoX, logoY, logoSize, logoSize);
        } catch (e) {
          doc.setDrawColor(200);
          doc.setFillColor(230, 242, 255);
          doc.roundedRect(logoX, logoY, logoSize, logoSize, 6, 6, "F");
        }
      } else {
        doc.setDrawColor(200);
        doc.setFillColor(230, 242, 255);
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 6, 6, "F");
      }

      const userTitle = user?.displayName ? `${sanitize(user.displayName)}'s Business Report` : `${acctName}'s Business Report`;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(28);
      doc.text(userTitle, left + logoSize + 12, logoY + 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text(`Generated On - ${generatedOn}`, left + logoSize + 12, logoY + 34);

      let rightTopText = user?.displayName || user?.email || "";
      if (rightTopText) {
        doc.setFontSize(9);
        doc.setTextColor(120);
        const w = doc.getTextWidth(rightTopText);
        doc.text(rightTopText, right - w, logoY + 18);
      }

      // Divider
      doc.setDrawColor(220);
      doc.setLineWidth(0.6);
      doc.line(left, 70, right, 70);

      // Account title and meta
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      doc.text(`${acctName}`, left, 92);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.text(`${acctType} • Account ID: ${sanitize(account.id || account.accountId || "-")}`, left, 110);

      // Summary boxes
      const boxY = 120;
      const boxHeight = 36;
      const gap = 12;
      const boxWidth = (pageWidth - margin.left - margin.right - gap * 2) / 3;

      doc.setLineWidth(0.5);
      doc.setDrawColor(220);
      doc.setFillColor(250, 255, 250);
      doc.roundedRect(left, boxY, boxWidth, boxHeight, 6, 6, "F");
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.setFont("helvetica", "normal");
      doc.text("Total Cash in", left + 10, boxY + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 150, 83);
      doc.text(`${CURRENCY} ${fmt(totalCashIn)}`, left + 10, boxY + 28);

      const box2X = left + boxWidth + gap;
      doc.setFillColor(255, 250, 250);
      doc.roundedRect(box2X, boxY, boxWidth, boxHeight, 6, 6, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text("Total Cash out", box2X + 10, boxY + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(219, 68, 55);
      doc.text(`${CURRENCY} ${fmt(totalCashOut)}`, box2X + 10, boxY + 28);

      const box3X = box2X + boxWidth + gap;
      doc.setFillColor(250, 250, 255);
      doc.roundedRect(box3X, boxY, boxWidth, boxHeight, 6, 6, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text("Final Balance", box3X + 10, boxY + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const fbColor = closingBalance < 0 ? [219, 68, 55] : [11, 150, 83];
      doc.setTextColor(...fbColor);
      doc.text(`${CURRENCY} ${fmt(closingBalance)}`, box3X + 10, boxY + 28);

      // Footer
      const pageCount = typeof doc.getNumberOfPages === "function" ? doc.getNumberOfPages() : 1;
      const currentPage = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : pageCount;
      const footerLeft = left;
      const footerY = pageHeight - 30;
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${currentPage} of ${pageCount}`, footerLeft, footerY);

      const rightFooter = "Generated by FundFlare";
      const wRight = doc.getTextWidth(rightFooter);
      doc.text(rightFooter, pageWidth - margin.right - wRight, footerY);
    },
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : pageHeight - margin.bottom - 80;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("Summary", margin.left, finalY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70);

  const summaryLines = [
    `Opening Balance: ${CURRENCY} ${fmt(openingBalance)}`,
    `Total Cash in: ${CURRENCY} ${fmt(totalCashIn)}`,
    `Total Cash out: ${CURRENCY} ${fmt(totalCashOut)}`,
    `Closing Balance: ${CURRENCY} ${fmt(closingBalance)}`,
  ];
  summaryLines.forEach((line, i) => {
    doc.text(line, margin.left, finalY + 14 + i * 12);
  });

  const safeName = (acctName).replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  const filename = `${safeName}_Statement.pdf`;

  // Return a blob instead of saving directly
  const blob = doc.output("blob");
  return { blob, filename };
}
