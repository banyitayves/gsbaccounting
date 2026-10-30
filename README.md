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

The accountant account is initialized and kept in sync with the private `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_DISPLAY_NAME` environment variables. Changing those Vercel Production variables and redeploying resets the accountant login. After signing in, the accountant can use **Staff access** to create storekeeper accounts and assign each one a stock location. The generated password is displayed only once after account creation, so share it securely with that staff member.

Storekeepers can view and record stock movements only for their assigned location; other registers and approval actions are restricted to the accountant. The API enforces these permissions independently of the frontend. Stock issues are rejected when they exceed available stock, and each movement records the acting username. An item's opening quantity can only be recorded on its first entry; use received quantity for later replenishments. Do not expose the API publicly without HTTPS and an operational deployment configuration.

## Deploy to Vercel

The root `vercel.json` deploys the Vite frontend and Express API as Vercel services on one domain. Import `banyitayves/gsbaccounting` as a multi-service project with the repository root as the project root. The `/api/*` rewrite sends API requests to the backend; all other paths go to the frontend. The backend initializes its database schema on the first request.

Before deploying, create a reachable managed MySQL database. TiDB Cloud Starter is one option: it is MySQL-compatible and offers a free quota; set its monthly spending limit to `$0` to prevent charges and accept throttling after the quota is reached. Check the provider's current quota and pricing, and choose a database region appropriate for your data residency and users. Configure Vercel Environment Variables for Production (and Preview only if needed): either `DATABASE_URL` using the provider's connection URI, or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` separately. Set `DB_SSL=true` when required by the provider.

Also configure `ADMIN_USERNAME`, a unique `ADMIN_PASSWORD` of at least 12 characters, `ADMIN_DISPLAY_NAME`, and a random `JWT_SECRET` of at least 32 characters. Keep production credentials separate from local `backend/.env`; never commit or paste secrets into chat. Same-origin Vercel routing does not require `FRONTEND_ORIGIN`; set it only when enabling a separate cross-origin frontend. Redeploy after changing environment variables, then verify `/api/health` reports a connected database before entering financial data.

## Registers and workflow

- **Stock register:** dated movements with item code, opening + received − issued = balance, incoming/outgoing references, store location, issue purpose, preparer/checker, and remarks.
- **Filing register:** file code and date, document/category, supplier or payee and amount, term, required documents, completion status, physical/digital locations, preparer and reviewer, follow-up, and remarks.
- **Payments:** payment and request references/dates, supplier and TIN, purpose/items, pre-tax amount, checked tax type and tax amount, net payable, budget/requisition/contract/invoice/voucher references, approval status, payment method/date, proof/bank reference, file code, preparer, and remarks.
- **School feeding:** date, term, class/group and student reference, expected fee versus collection, calculated balance due, receipt, payment method and references, collector, deposit status/date, expense reference, file code, and remarks.
- **Suppliers:** supplier code/name, TIN, contact and address, goods/service, contract/PO reference, tax-clearance check, outstanding amount, last invoice/payment, file code, and remarks.
- **Approval workflow:** accountant-prepared requests with authorized approval or rejection actions.

The dashboard also provides independent academic-year and fiscal-year selectors. Each record is saved with both selected years and appears only when both selectors match, so year-to-year work remains separate. Search, CSV export for each register, a print view, summary metrics, and an approval queue are also included. Review local reporting/compliance requirements before using the system with production financial data.
