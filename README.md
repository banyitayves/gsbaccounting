# GS Busanza Accounting Control System

A React and Vite accounting workspace backed by an Express API and MySQL. The dashboard and register names follow the supplied GS Busanza workbook: stock, filing, payments, school feeding, suppliers, and approvals.

## Requirements

- Node.js 20.19+ (required by Vite 8)
- MySQL 8+

## Start the application

1. Run `setup_database.bat` once. It initializes the installed MySQL Server 8.4 in a persistent, local-only data folder, creates the `gs_busanza_accounting` database and restricted application account, and generates the accountant login and secrets.
2. In `backend`, run `npm install` once. Then run `run_backend.bat`; it starts the local MySQL server and accounting API.
3. In a separate terminal, in `frontend`, run `npm install` once, then `npm run dev` (or use `run_frontend_dev.bat`).
4. Open the Vite URL, normally `http://localhost:5173`. Sign in with the username and password listed in the private `backend/.env` file. The password is generated during setup. The HTTP-only session cookie expires after eight hours; use **Log out** in the sidebar to end the session.
5. Run `setup_backup.bat` once to register the daily 2:00 AM and Sunday 2:30 AM Windows scheduled tasks. Backups are compressed, SHA-256 checksummed, and saved under `%LOCALAPPDATA%\GSBusanzaAccounting\backups`; the last 30 days are retained. The log is `%LOCALAPPDATA%\GSBusanzaAccounting\backup.log`. The tasks run when your Windows account is signed in. Run `backup_database.bat` any time for an extra manual backup.

To restore a backup, start MySQL and run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File backend\restore_backup.ps1 -BackupFile "<path-to-backup.sql.gz>"`. The script verifies the checksum and uses the local MySQL administrator password stored beside the database, since a full restore must recreate tables. Confirm the `RESTORE` prompt; restore replaces the current contents of the accounting database. Add `-Force` only when restoring from a non-interactive terminal.

The MySQL data files are stored under `%LOCALAPPDATA%\GSBusanzaAccounting\mysql-data`, outside the project. Database and accountant secrets are stored in `backend/.env`, which is excluded from Git and restricted to your Windows account and system administrators; the local MySQL administrator password is saved beside the database with the same access restrictions. Keep both locations private. Backups are also stored locally, so periodically copy them to a separate encrypted drive or approved off-device storage for protection against device loss. The API creates/migrates the register table at startup and indexes academic/fiscal year fields. Existing records without year tags are assigned to academic year 2026–2027 and fiscal year 2026–2027.

The current authentication setup supports one accountant account configured through private environment variables. Do not expose the API publicly without HTTPS and an operational deployment configuration.

## Deploy to Vercel

The root `vercel.json` builds the frontend and routes `/api/*` to an Express serverless function. In Vercel, import `banyitayves/gsbaccounting` with the project root set to the repository root. Before the first production deployment, provision a reachable managed MySQL database and add its connection settings in the Vercel project’s Environment Variables; never commit production credentials. You may set `DATABASE_URL` to the provider’s MySQL connection URI, or set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` separately. Set `DB_SSL=true` when the provider requires verified TLS.

Also configure `ADMIN_USERNAME`, a unique `ADMIN_PASSWORD` of at least 12 characters, `ADMIN_DISPLAY_NAME`, and a random `JWT_SECRET` of at least 32 characters. Keep these production values separate from the local `backend/.env`; do not reuse the development credentials. The API initializes its table and year indexes on its first request. Set `FRONTEND_ORIGIN` to the deployed app’s origin if using cross-origin access; the default same-origin Vercel setup does not require cross-origin API calls. Apply environment variable changes to the deployment and verify `/api/health` reports a connected database before entering financial data.

## Registers and workflow

- **Stock register:** dated movements with item code, opening + received − issued = balance, incoming/outgoing references, store location, issue purpose, preparer/checker, and remarks.
- **Filing register:** file code and date, document/category, supplier or payee and amount, term, required documents, completion status, physical/digital locations, preparer and reviewer, follow-up, and remarks.
- **Payments:** payment and request references/dates, supplier and TIN, purpose/items, pre-tax amount, checked tax type and tax amount, net payable, budget/requisition/contract/invoice/voucher references, approval status, payment method/date, proof/bank reference, file code, preparer, and remarks.
- **School feeding:** date, term, class/group and student reference, expected fee versus collection, calculated balance due, receipt, payment method and references, collector, deposit status/date, expense reference, file code, and remarks.
- **Suppliers:** supplier code/name, TIN, contact and address, goods/service, contract/PO reference, tax-clearance check, outstanding amount, last invoice/payment, file code, and remarks.
- **Approval workflow:** accountant-prepared requests with authorized approval or rejection actions.

The dashboard also provides independent academic-year and fiscal-year selectors. Each record is saved with both selected years and appears only when both selectors match, so year-to-year work remains separate. Search, CSV export for each register, a print view, summary metrics, and an approval queue are also included. Review local reporting/compliance requirements before using the system with production financial data.
