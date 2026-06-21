# Public Procurement Payments Tracker (PoC ID: 97)

The **Public Procurement Payments Tracker** is a production-grade analytical platform built for the **Real Rails Intelligence Library**. It tracks and visualizes the complete lifecycle of federal government expenditures: **Contract Award &rarr; Invoice Checkpoint &rarr; Disbursed Payment**.

The tool identifies payment processing bottlenecks, agency performance metrics, and Prompt Payment Act compliance delays across agencies and major government contractors.

---

## 🏗️ Architecture & Folder Structure

This application is set up in a decoupled monorepo structure:

```
├── backend/                  # FastAPI & DuckDB Python backend
│   ├── app/
│   │   ├── database.py       # SQL Query layer & DuckDB connector
│   │   ├── generator.py      # High-fidelity USAspending/SAM.gov generator
│   │   └── main.py           # FastAPI server routes & CORS middlewares
│   ├── requirements.txt      # Python dependencies
│   └── data/
│       └── procurement.db    # Columns-optimized DuckDB analytical database
│
├── frontend/                 # React & Next.js client-side interface
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css   # Theme styling & custom scrollbars
│   │   │   ├── layout.tsx    # App root, fonts & global headers
│   │   │   └── page.tsx      # Main dashboard with filters and cards
│   │   ├── components/
│   │   │   ├── KPICard.tsx       # Glassmorphism metric cards
│   │   │   ├── DelayHeatmap.tsx  # Agency vs Contract Type delay grid
│   │   │   ├── SankeyDiagram.tsx # Multi-step flow visualization
│   │   │   ├── TimelineChart.tsx # Aggregated processing times chart
│   │   │   ├── Leaderboards.tsx  # Rankings list with progress meters
│   │   │   └── DataTable.tsx     # TanStack searchable table with CSV downloader
│   │   └── lib/
│   │       └── api.ts            # Client API hooks
│   ├── tsconfig.json
│   └── package.json
│
├── README.md                 # System overview & installation
├── VAR.md                    # Visual Assurance Report (Design & UI details)
└── UAT.md                    # User Acceptance Testing Checklist
```

---

## 🛠️ Tech Stack & Libraries

- **Analytics Core**: FastAPI (Python), Pandas, DuckDB (OLAP database for fast columnar calculations).
- **Data Source**: USAspending.gov and SAM.gov APIs (Synthesized locally with high fidelity to bypass rate limiting).
- **Frontend Core**: React, Next.js (App Router, Tailwind CSS, TypeScript).
- **Data Visualizations**: Apache ECharts (via `echarts-for-react` for responsive Sankey flow, Heatmap, and line trends).
- **Data Table**: `@tanstack/react-table` (for pagination, search, status coloring).

---

## 🚀 Launching the Platform

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**

### 2. Backend Setup
Navigate to the `backend/` directory, create a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # On Windows
pip install -r requirements.txt
```

To seed the database with the synthetic dataset (300 awards, ~780 invoice-payment streams):
```bash
python -m app.generator
```

To run the FastAPI server on port 8000:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
In another terminal, navigate to the `frontend/` directory and run:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive dashboard.

---

## 🧠 Database Schema

1. **`awards`**: Tracks original contract milestones:
   - `award_id` (PK), `agency_name`, `vendor_name`, `award_date`, `amount`, `contract_type`, `status`, `description`.
2. **`invoices`**: Tracks milestone invoice requests:
   - `invoice_id` (PK), `award_id` (FK), `invoice_date`, `amount`, `status` (`Approved`, `Pending`, `Disputed`).
3. **`payments`**: Tracks payout records & completion delay:
   - `payment_id` (PK), `invoice_id` (FK), `payment_date`, `amount`, `status` (`Completed`, `Delayed`, `In Progress`), `completion_days` (Processing duration).
