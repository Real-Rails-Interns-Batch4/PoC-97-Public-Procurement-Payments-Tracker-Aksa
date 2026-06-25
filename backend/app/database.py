import os
import sys

# Add parent directory of 'app' to system path to allow running as script or from app folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import duckdb
from typing import Dict, List, Optional
from datetime import date

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "procurement.db"))

def get_connection(read_only: bool = True):
    """
    Returns a connection to the DuckDB database.
    If the database file does not exist, is empty, or lacks required tables, triggers generation.
    """
    db_needs_generation = False
    if not os.path.exists(DB_PATH) or os.path.getsize(DB_PATH) == 0:
        db_needs_generation = True
    else:
        # Check if tables exist
        try:
            conn = duckdb.connect(DB_PATH, read_only=True)
            tables = [r[0] for r in conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='main';").fetchall()]
            conn.close()
            if not all(t in tables for t in ["awards", "invoices", "payments"]):
                db_needs_generation = True
        except Exception as e:
            print(f"Error checking database tables: {e}. Triggering regeneration.")
            db_needs_generation = True

    if db_needs_generation:
        # Dynamically import to avoid circular dependency
        from app.generator import generate_synthetic_data
        print(f"Database at {DB_PATH} is missing, empty, or incomplete. Generating synthetic data...")
        generate_synthetic_data(DB_PATH, num_awards=300)
        
    return duckdb.connect(DB_PATH, read_only=read_only)

def build_filter_clause(
    agencies: Optional[List[str]] = None,
    vendors: Optional[List[str]] = None,
    contract_types: Optional[List[str]] = None,
    statuses: Optional[List[str]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> tuple[str, list]:
    """
    Helper function to dynamically build SQL WHERE clause and parameters
    for filtered queries.
    """
    clauses = ["1=1"]
    params = []
    
    if agencies:
        placeholders = ", ".join(["?"] * len(agencies))
        clauses.append(f"a.agency_name IN ({placeholders})")
        params.extend(agencies)
        
    if vendors:
        placeholders = ", ".join(["?"] * len(vendors))
        clauses.append(f"a.vendor_name IN ({placeholders})")
        params.extend(vendors)
        
    if contract_types:
        placeholders = ", ".join(["?"] * len(contract_types))
        clauses.append(f"a.contract_type IN ({placeholders})")
        params.extend(contract_types)
        
    if statuses:
        placeholders = ", ".join(["?"] * len(statuses))
        # Filters payments by status
        clauses.append(f"COALESCE(p.status, 'Unpaid') IN ({placeholders})")
        params.extend(statuses)
        
    if start_date:
        clauses.append("a.award_date >= ?")
        params.append(start_date)
        
    if end_date:
        clauses.append("a.award_date <= ?")
        params.append(end_date)
        
    return " AND ".join(clauses), params

def get_kpis(filters: dict) -> dict:
    """
    Calculates executive KPIs based on active filters.
    """
    where_clause, params = build_filter_clause(**filters)
    conn = get_connection()
    
    # 1. Awards KPIs (distinct counts and sum using a subquery to avoid join inflation)
    awards_q = f"""
        SELECT 
            COUNT(*),
            COALESCE(SUM(amount), 0.0)
        FROM (
            SELECT DISTINCT a.award_id, a.amount 
            FROM awards a
            LEFT JOIN invoices i ON a.award_id = i.award_id
            LEFT JOIN payments p ON i.invoice_id = p.invoice_id
            WHERE {where_clause}
        ) sub
    """
    awards_res = conn.execute(awards_q, params).fetchone()
    
    # 2. Payments KPIs (distinct counts, sums, average delays, delayed count)
    payments_q = f"""
        SELECT 
            COUNT(DISTINCT p.payment_id) as total_payments_count,
            COALESCE(SUM(p.amount), 0.0) as total_payments_amount,
            COALESCE(AVG(p.completion_days), 0.0) as avg_payment_days,
            SUM(CASE WHEN p.status = 'Delayed' THEN 1 ELSE 0 END) as delayed_payments_count
        FROM awards a
        LEFT JOIN invoices i ON a.award_id = i.award_id
        JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
    """
    payments_res = conn.execute(payments_q, params).fetchone()
    conn.close()
    
    return {
        "total_awards_count": int(awards_res[0]),
        "total_awards_amount": float(awards_res[1]),
        "total_payments_count": int(payments_res[0] or 0),
        "total_payments_amount": float(payments_res[1] or 0.0),
        "avg_payment_days": round(float(payments_res[2] or 0.0), 1),
        "delayed_payments_count": int(payments_res[3] or 0)
    }

def get_delay_heatmap(filters: dict) -> List[dict]:
    """
    Gets average payment delay grouped by Agency (Y-axis) and Contract Type (X-axis).
    """
    where_clause, params = build_filter_clause(**filters)
    conn = get_connection()
    
    q = f"""
        SELECT 
            a.agency_name,
            a.contract_type,
            ROUND(AVG(p.completion_days), 1) as avg_days,
            COUNT(p.payment_id) as payment_count
        FROM awards a
        JOIN invoices i ON a.award_id = i.award_id
        JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause} AND p.completion_days IS NOT NULL
        GROUP BY a.agency_name, a.contract_type
        ORDER BY a.agency_name, a.contract_type
    """
    res = conn.execute(q, params).fetchall()
    conn.close()
    
    return [
        {
            "agency": row[0],
            "contract_type": row[1],
            "avg_days": float(row[2]),
            "count": int(row[3])
        } for row in res
    ]

def get_sankey_data(filters: dict) -> dict:
    """
    Constructs a directed flow of procurement:
    Agency/Vendor -> Invoice Status -> Payment Status
    """
    where_clause, params = build_filter_clause(**filters)
    conn = get_connection()
    
    # 1. Flow: Agency -> Invoice Status
    q1 = f"""
        SELECT 
            a.agency_name as source,
            COALESCE(i.status, 'No Invoice') as target,
            SUM(COALESCE(i.amount, a.amount)) as amount
        FROM awards a
        LEFT JOIN invoices i ON a.award_id = i.award_id
        LEFT JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
        GROUP BY source, target
    """
    res1 = conn.execute(q1, params).fetchall()
    
    # 2. Flow: Invoice Status -> Payment Status
    # Filter params needs to match the where clause
    q2 = f"""
        SELECT 
            i.status as source,
            COALESCE(p.status, 'Unpaid/Pending') as target,
            SUM(i.amount) as amount
        FROM awards a
        JOIN invoices i ON a.award_id = i.award_id
        LEFT JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
        GROUP BY source, target
    """
    res2 = conn.execute(q2, params).fetchall()
    conn.close()
    
    # Combine links
    links = []
    nodes = set()
    
    # Add first stage links
    for row in res1:
        if row[0] and row[1]:
            links.append({"source": row[0], "target": f"Invoice: {row[1]}", "value": round(float(row[2]), 2)})
            nodes.add(row[0])
            nodes.add(f"Invoice: {row[1]}")
            
    # Add second stage links
    for row in res2:
        if row[0] and row[1]:
            links.append({"source": f"Invoice: {row[0]}", "target": f"Payment: {row[1]}", "value": round(float(row[2]), 2)})
            nodes.add(f"Invoice: {row[0]}")
            nodes.add(f"Payment: {row[1]}")
            
    return {
        "nodes": [{"name": node} for node in sorted(nodes)],
        "links": links
    }

def get_timeline_chart(filters: dict) -> List[dict]:
    """
    Retrieves aggregated timelines:
    Grouped by Award Month to show trends of average processing times.
    """
    where_clause, params = build_filter_clause(**filters)
    conn = get_connection()
    
    q = f"""
        SELECT 
            STRFTIME(a.award_date, '%Y-%m') as month,
            AVG(EPOCH(i.invoice_date) - EPOCH(a.award_date)) / 86400 as avg_days_to_invoice,
            AVG(p.completion_days) as avg_days_to_payment,
            COUNT(DISTINCT a.award_id) as award_count
        FROM awards a
        LEFT JOIN invoices i ON a.award_id = i.award_id
        LEFT JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
        GROUP BY month
        ORDER BY month
    """
    res = conn.execute(q, params).fetchall()
    conn.close()
    
    return [
        {
            "month": row[0],
            "days_to_invoice": round(float(row[1] or 0.0), 1),
            "days_to_payment": round(float(row[2] or 0.0), 1),
            "count": int(row[3])
        } for row in res if row[0] is not None
    ]

def get_leaderboards(filters: dict) -> dict:
    """
    Returns performance lists for Agencies and Vendors.
    """
    where_clause, params = build_filter_clause(**filters)
    conn = get_connection()
    
    # Agency Leaderboard
    agency_q = f"""
        SELECT 
            a.agency_name,
            COUNT(DISTINCT a.award_id) as total_awards,
            COALESCE(SUM(p.amount), 0.0) as total_payments,
            COALESCE(AVG(p.completion_days), 0.0) as avg_delay_days,
            COALESCE(SUM(CASE WHEN p.status = 'Delayed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(p.payment_id), 0), 0.0) as delay_rate
        FROM awards a
        LEFT JOIN invoices i ON a.award_id = i.award_id
        LEFT JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
        GROUP BY a.agency_name
        ORDER BY avg_delay_days DESC
    """
    agency_res = conn.execute(agency_q, params).fetchall()
    
    # Vendor Leaderboard
    vendor_q = f"""
        SELECT 
            a.vendor_name,
            COUNT(DISTINCT a.award_id) as total_awards,
            COALESCE(SUM(p.amount), 0.0) as total_payments,
            COALESCE(AVG(p.completion_days), 0.0) as avg_delay_days,
            COALESCE(SUM(CASE WHEN p.status = 'Delayed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(p.payment_id), 0), 0.0) as delay_rate
        FROM awards a
        LEFT JOIN invoices i ON a.award_id = i.award_id
        LEFT JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
        GROUP BY a.vendor_name
        ORDER BY avg_delay_days DESC
    """
    vendor_res = conn.execute(vendor_q, params).fetchall()
    conn.close()
    
    return {
        "agencies": [
            {
                "name": row[0],
                "awards": int(row[1]),
                "payments_amount": float(row[2]),
                "avg_delay": round(float(row[3]), 1),
                "delay_rate": round(float(row[4] or 0.0), 1)
            } for row in agency_res
        ],
        "vendors": [
            {
                "name": row[0],
                "awards": int(row[1]),
                "payments_amount": float(row[2]),
                "avg_delay": round(float(row[3]), 1),
                "delay_rate": round(float(row[4] or 0.0), 1)
            } for row in vendor_res
        ]
    }

def get_transaction_table(filters: dict, limit: int = 100) -> List[dict]:
    """
    Gets flattened transaction rows for the data table.
    """
    where_clause, params = build_filter_clause(**filters)
    conn = get_connection()
    
    q = f"""
        SELECT 
            a.award_id,
            a.agency_name,
            a.vendor_name,
            a.award_date,
            a.amount as award_amount,
            a.contract_type,
            a.status as award_status,
            i.invoice_id,
            i.invoice_date,
            i.amount as invoice_amount,
            i.status as invoice_status,
            p.payment_id,
            p.payment_date,
            p.amount as payment_amount,
            p.status as payment_status,
            p.completion_days,
            a.data_source,
            COALESCE(p.data_source, 'Synthetic (Simulated)') as payment_source
        FROM awards a
        LEFT JOIN invoices i ON a.award_id = i.award_id
        LEFT JOIN payments p ON i.invoice_id = p.invoice_id
        WHERE {where_clause}
        ORDER BY a.award_date DESC, i.invoice_date DESC
        LIMIT {limit}
    """
    res = conn.execute(q, params).fetchall()
    conn.close()
    
    return [
        {
            "award_id": row[0],
            "agency_name": row[1],
            "vendor_name": row[2],
            "award_date": str(row[3]),
            "award_amount": float(row[4]),
            "contract_type": row[5],
            "award_status": row[6],
            "invoice_id": row[7] or "N/A",
            "invoice_date": str(row[8]) if row[8] else "N/A",
            "invoice_amount": float(row[9]) if row[9] else 0.0,
            "invoice_status": row[10] or "N/A",
            "payment_id": row[11] or "N/A",
            "payment_date": str(row[12]) if row[12] else "N/A",
            "payment_amount": float(row[13]) if row[13] else 0.0,
            "payment_status": row[14] or "Unpaid",
            "completion_days": int(row[15]) if row[15] is not None else None,
            "award_source": row[16] or "Real (USAspending.gov)",
            "payment_source": row[17] or "Synthetic (Simulated)"
        } for row in res
    ]

def get_filter_options() -> dict:
    """
    Gets list of unique filter options for dropdowns.
    """
    try:
        conn = get_connection()
        agencies = [r[0] for r in conn.execute("SELECT DISTINCT agency_name FROM awards WHERE agency_name IS NOT NULL AND agency_name != '' ORDER BY agency_name;").fetchall()]
        vendors = [r[0] for r in conn.execute("SELECT DISTINCT vendor_name FROM awards WHERE vendor_name IS NOT NULL AND vendor_name != '' ORDER BY vendor_name;").fetchall()]
        contract_types = [r[0] for r in conn.execute("SELECT DISTINCT contract_type FROM awards WHERE contract_type IS NOT NULL AND contract_type != '' ORDER BY contract_type;").fetchall()]
        conn.close()
    except Exception as e:
        print(f"Error fetching filter options: {e}")
        return {
            "agencies": [],
            "vendors": [],
            "contract_types": []
        }
    
    return {
        "agencies": agencies,
        "vendors": vendors,
        "contract_types": contract_types
    }
