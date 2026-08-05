# FundFlare

FundFlare is a React + Vite personal finance tracker that uses Firebase for authentication and Firestore data storage. It helps you manage accounts, record transactions, view financial summaries, export statements as PDF, and import transactions from CSV.

---

## Features

- Google sign-in using Firebase Authentication
- Dashboard summary with:
  - Net assets
  - Cash & bank balance
  - Investment balance
  - Reserved funds
  - Receivables and payables
- Account management:
  - Create new accounts
  - Disable / enable accounts
  - Search and filter accounts by name and type
- Transaction management:
  - Add, edit, delete transactions
  - Track credit/debit amounts
  - Filter transactions by account, date range, month, year, and type
- Account detail view:
  - See account-specific transactions
  - Export filtered account statements to PDF
  - Open statements in a viewer
- CSV import:
  - Import transactions from CSV
  - Auto-create accounts based on category names

---

## Tech Stack

- React
- Vite
- Material UI
- Firebase Auth
- Firebase Firestore
- React Router
- jsPDF
- react-pdf
- PapaParse

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

Create a file named `.env` in the project root and add the following values:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 3. Example `.env` values

```dotenv
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Ignore `.env`

Make sure `.env` is ignored by Git. Add this to `.gitignore` if it is not already present:

```gitignore
.env
.env.local
```

### 5. Run the app

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

---

## Notes

- `src/lib/firebase.js` loads Firebase config from `import.meta.env.VITE_FIREBASE_*`.
- Keeping `.env` out of Git helps protect project secrets and configuration from being published.
- If `.env` was accidentally committed, remove it from tracking with:

```bash
git rm --cached .env
git commit -m "Remove .env from repository"
```

---

## Project structure

- `src/lib/firebase.js` — Firebase initialization
- `src/context/AuthContext.jsx` — Firebase auth provider
- `src/services/` — Firestore account and transaction logic
- `src/pages/` — Dashboard, accounts, transactions, import, and statement viewer pages
- `src/components/` — account detail components and PDF export helpers
