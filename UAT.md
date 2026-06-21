# User Acceptance Testing (UAT) Checklist - PoC ID: 97

Follow this checklist to verify that all features of the **Public Procurement Payments Tracker** are fully functional and ready for deployment.

---

## 📋 Test Matrix

### Test 1: Database Initialization & Seeding
- **Action**: Run `python -m app.generator` in the `backend/` directory.
- **Expected Outcome**:
  - The script prints confirmation messages: `Awards inserted: 300`, `Invoices inserted: 779`, `Payments inserted: 770`.
  - The DuckDB database file `backend/data/procurement.db` is created.

### Test 2: Server Launch & CORS Communication
- **Action**: Start uvicorn server on port 8000 and dev server on port 3000. Open `http://localhost:3000`.
- **Expected Outcome**:
  - The dashboard displays without loading spinner crashes.
  - KPI cards populate with real totals (e.g. Total Value Awarded, Avg Payment Delay).
  - System status indicators display `SYS STATUS: ONLINE` on the top header.

### Test 3: Strategic Stories and Insights
- **Action**: Read through the three intelligence stories at the top.
- **Expected Outcome**:
  - Storycards highlight realistic bottlenecks: DoD Time & Materials delays (~58 days) and fast-tracked medical payments under HHS (~14 days).

### Test 4: Dynamic Filters Updates
- **Action**: Select `Department of Defense (DoD)` from the Agency dropdown list.
- **Expected Outcome**:
  - The KPI values update immediately to reflect only DoD awards.
  - The average payment delay card updates to show higher processing averages (typically ~40–50+ days).
  - The Sankey diagram changes its leftmost nodes to highlight DoD flow streams only.

### Test 5: Vendor Performance Search
- **Action**: Select `Pfizer Inc.` or `McKesson Corp.` in the Vendor filter list.
- **Expected Outcome**:
  - The Average Payment Delay drops significantly (~10-15 days).
  - The Sankey diagram lists Pfizer/McKesson related invoice streams.

### Test 6: Global Text Search & Table Pagination
- **Action**: Type `AWD` or a specific vendor name into the Search input on the Ledger table.
- **Expected Outcome**:
  - The table filter narrows down the results dynamically.
  - Pagination updates indices and record counts accordingly.

### Test 7: Streaming CSV Export
- **Action**: Apply a filter (e.g., Status: "Delayed") and click the `Export CSV` button.
- **Expected Outcome**:
  - A file named `procurement_payments_export_<date>.csv` is downloaded.
  - Opening the file in Excel/Notepad confirms it contains only the records matching the applied filter.
