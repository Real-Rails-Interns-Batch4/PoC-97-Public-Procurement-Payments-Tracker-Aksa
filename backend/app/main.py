from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io
import csv

from app import database

app = FastAPI(title="Public Procurement Payments Tracker API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Public Procurement Payments Tracker API is running",
        "docs": "/docs",
        "endpoints": {
            "filters": "/api/filters",
            "dashboard": "/api/dashboard",
            "transactions": "/api/transactions",
            "export": "/api/export"
        }
    }


class FilterPayload(BaseModel):
    agencies: Optional[List[str]] = None
    vendors: Optional[List[str]] = None
    contract_types: Optional[List[str]] = None
    statuses: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

@app.get("/api/filters")
def get_filters():
    """
    Exposes unique filters for UI dropdowns.
    """
    try:
        return database.get_filter_options()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dashboard")
def get_dashboard_data(payload: FilterPayload):
    """
    Consolidated analytics for the dashboard metrics and visual components.
    """
    try:
        filters = payload.dict()
        return {
            "kpis": database.get_kpis(filters),
            "heatmap": database.get_delay_heatmap(filters),
            "sankey": database.get_sankey_data(filters),
            "timeline": database.get_timeline_chart(filters),
            "leaderboards": database.get_leaderboards(filters)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transactions")
def get_transactions(payload: FilterPayload, limit: int = 150):
    """
    Exposes paginated/limited data list for the search table.
    """
    try:
        filters = payload.dict()
        return database.get_transaction_table(filters, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export")
def export_transactions(payload: FilterPayload):
    """
    Exposes streaming CSV downloader for the active filtered dataset.
    """
    try:
        filters = payload.dict()
        # Retrieve up to 10000 records for bulk CSV export
        records = database.get_transaction_table(filters, limit=10000)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        if records:
            # Column headers
            headers = list(records[0].keys())
            writer.writerow(headers)
            # Row values
            for row in records:
                writer.writerow([row[key] for key in headers])
                
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue().encode("utf-8")]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=procurement_payments_export.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
