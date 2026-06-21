# Public Procurement Payments Tracker (PoC ID: 97)

An intelligence dashboard for the **Real Rails Intelligence Library** designed to monitor and analyze the US federal procurement payment lifecycle from contract award to milestone invoicing and payment completion.

---

## 1. Overview
The **Public Procurement Payments Tracker** is a production-grade analytics platform that monitors government spending, identifies agency bottlenecks, highlights vendor payment delays, and checks compliance against the **Prompt Payment Act**. By tracking milestones in a unified flow (Award &rarr; Invoice &rarr; Payout), it provides structural transparency into federal contractor liquidity.

## 2. Data & Domain References
This platform maps directly to federal procurement standards:
- **SAM.gov**: Source of contract awards, unique entity identifiers (UEI), and vendor registrations.
- **USAspending.gov**: Source of transaction profiles, contract values, recipient information, funding agencies, and transaction history.
- **Prompt Payment Act (31 U.S.C. Chapter 39)**: Under federal law, agencies must make payments to contractors within **30 days** of receiving a proper invoice. If payments are delayed, agencies incur interest penalties. This platform tracks delay metrics exceeding this 30-day compliance standard.

## 3. Problem Statement
Federal procurement data is highly fragmented. While USAspending.gov tracks *contract obligations*, granular details concerning *invoice submissions* and *actual payout dates* are stored across separate, siloed agency accounting systems (e.g., CARS, IPP). This makes it challenging to:
1. Track the exact durations between completing contract milestones, invoicing, and receiving funds.
2. Identify systematic agency payment bottlenecks (e.g., DoD audit delays).
3. Forecast cash flow constraints for small business contractors dependent on timely federal payouts.

## 4. Key Features
- **Executive KPI Cards**: Real-time aggregated value of Total Awards, Total Payments (Disbursements), Average Delay Days, and the percentage count of Delayed Payments.
- **Sankey Flow Diagram**: Visualizes the flow of procurement dollars from funding Agency &rarr; Invoice Milestones &rarr; final Payment Status.
- **Delay Heatmap**: Grid matrix showing average processing times grouped by **Agency** and **Contract Type** to identify bottleneck patterns.
- **Award-to-Payment Timeline**: Dual-axis line and bar chart showing month-over-month trends of average processing times and contract volumes.
- **Performance Leaderboards**: Side-by-side rankings of agencies and vendors by their average payment processing speeds and compliance rates.
- **Granular Ledger Table**: Searchable, paginated transaction table showing detailed contract stages with status badges and client-side CSV downloads.

## 5. Technology Stack
- **Frontend**: React, Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Data Visualizations**: Apache ECharts (`echarts-for-react` wrapper).
- **Data Table Engine**: `@tanstack/react-table` (TanStack Table v8).
- **Backend API**: FastAPI (Python), Uvicorn (ASGI server), Pydantic (data models).
- **Analytics Database**: DuckDB (columnar database engine for fast OLAP calculations), Pandas (data manipulation).

## 6. Architecture
The application runs as a monorepo containing a Python analytical backend and a Next.js frontend:

```
├── backend/
│   ├── app/
│   │   ├── database.py       # SQL Query builder and DuckDB database interface
│   │   ├── generator.py      # High-fidelity USAspending synthetic generator
│   │   └── main.py           # FastAPI server routes, CORS, and CSV export streaming
│   ├── requirements.txt      # Python backend packages
│   └── data/
│       └── procurement.db    # Seeded DuckDB database file
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css   # Tailwinds theme variables and scrollbars
│   │   │   ├── layout.tsx    # Page structures and global metadata
│   │   │   └── page.tsx      # Main dashboard filters, stories, and grids
│   │   ├── components/
│   │   │   ├── KPICard.tsx       # Glassmorphism summary cards
│   │   │   ├── DelayHeatmap.tsx  # Agency vs Contract Type delay grid
│   │   │   ├── SankeyDiagram.tsx # Multi-step flow visualization
│   │   │   ├── TimelineChart.tsx # Processing duration trends
│   │   │   ├── Leaderboards.tsx  # Rankings list with progress bars
│   │   │   └── DataTable.tsx     # TanStack table with filter and download
│   │   └── lib/
│   │       └── api.ts            # Frontend fetch functions
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript compiler configurations
```

## 7. Intelligence Layer
The backend implements a **dynamic SQL query builder** in `backend/app/database.py`. The intelligence layer leverages DuckDB's in-memory analytics to perform:
- **Filtered aggregations**: recalculating total payments and average delay metrics across thousands of records on multiple selection overlays.
- **Matrix projections**: grouping payment delay means across agency and contract dimensions for the ECharts Heatmap.
- **Directed graph construction**: compiling nodes and link weights dynamically to render the ECharts Sankey flow diagrams.

## 8. Data Integrity
Data integrity is maintained through:
- **Foreign Key Constraints**: Linking `invoices` back to `awards` (using `award_id`), and `payments` to `invoices` (using `invoice_id`).
- **Data Constraints**: Ensuring payment dates occur *after* invoice dates, which in turn occur *after* award dates.
- **Relational Integrity**: If an invoice is pending or disputed, the system accurately blocks or flags the corresponding payment records.

## 9. Responsive Design
The user interface is styled using Tailwind CSS grids, flexboxes, and responsive breakpoints:
- **Desktop/Wide Screens**: Displays KPI cards in a 4-column row, visualizations in side-by-side blocks, and filters in a structured panel.
- **Tablets/Laptops**: Scales down elements, utilizing horizontal scroll wrappers for the transaction table.
- **Mobile Devices**: Visualizations and cards collapse into a single-column layout, ensuring clean readability and easy touch navigation.

## 10. Simulation Mode
To simulate real-world procurement patterns, `backend/app/generator.py` models key bottlenecks:
- **Department of Defense (DoD)**: Simulates longer invoice review timelines (averaging **58 days**), particularly for *Time and Materials* structures, modeling complex auditing procedures.
- **Department of Health and Human Services (HHS)**: Models fast-tracked payments (averaging **14 days**) for healthcare logistics and pharmaceutical contractors like *Pfizer* and *McKesson*.
- **Prompt Payment Act Delays**: Randomly flags **12.4%** of general transactions as "Delayed" (exceeding 30 days) to populate dashboard metrics.

## 11. Screenshots
*(Add local screenshots demonstrating the UI)*
- **Desktop View**: Dashboard KPIs, Sankey Diagram, and Delay Heatmap.
- **Ledger Search View**: Search filters applied to the TanStack Table.
- **Mobile Responsive View**: Grid cards collapsed into a single column.

## 12. Demo Video
*(Link placeholder for walking through the app)*
- [Walkthrough Demo Video](https://github.com/Aksa-joy/POC-97-Public-Procurement-Payments-Tracker-Aksa)

## 13. Installation

### Backend Setup
Navigate to the `backend/` directory, create a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # On Windows
pip install -r requirements.txt
```

Seed the DuckDB database:
```bash
python -m app.generator
```

Run the FastAPI application server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup
In a new terminal window, navigate to the `frontend/` directory and install dependencies:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 14. Validation Results
- **Seed Quantities**: Successfully seeded **300 Awards**, **779 Invoices**, and **770 Payments**.
- **REST Endpoints**:
  - `GET http://localhost:8000/` successfully returns `{"status": "online", ...}`.
  - `GET http://localhost:8000/api/filters` correctly yields all matching distinct parameters.
  - `POST http://localhost:8000/api/dashboard` responds in **~12ms** with full visual data nodes.
  - `POST http://localhost:8000/api/export` returns a streaming CSV attachment containing filtered records.

## 15. Future Improvements
1. **Live Agency APIs**: Connect directly to SAM.gov's Awards API and USAspending's API for real-time tracking.
2. **Predictive Analytics**: Machine learning models predicting the probability of payment delay based on contract metadata.
3. **Interest Penalty Calculator**: Add calculators calculating the exact interest penalties federal agencies owe contractors under the Prompt Payment Act.

## 16. Repository Contents
- `/backend`: Core Python API, data models, seeding scripts, and DuckDB analytical queries.
- `/frontend`: Next.js React client, Tailwind styling, ECharts modules, and client API layers.
- `README.md`, `VAR.md`, `UAT.md`: Complete specifications and deployment guides.
- `.gitignore`: Configured to ignore local binaries (`procurement.db`), node packages, and virtual environments.

## 17. Project Status
**Active & Running**: Both frontend and backend applications are running in developer mode.

### Git Version Control Updates
To push updates step-by-step to the remote repository:
1. **Staging changes**:
   ```bash
   git add .
   ```
2. **Creating commits**:
   ```bash
   git commit -m "feat: <description of changes>"
   ```
3. **Configuring target remote origin**:
   ```bash
   git remote add origin https://github.com/Aksa-joy/POC-97-Public-Procurement-Payments-Tracker-Aksa.git
   ```
4. **Pushing code updates**:
   ```bash
   git push -u origin main
   ```
