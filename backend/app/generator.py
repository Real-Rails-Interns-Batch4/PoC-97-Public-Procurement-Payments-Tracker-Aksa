import os
import sys
import random
import uuid
import json
import duckdb
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add parent directory of 'app' to system path to allow running as script or from app folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

# Load seed data from JSON file
SEED_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "seed_data.json"))
try:
    with open(SEED_DATA_PATH, "r", encoding="utf-8") as f:
        seed_data = json.load(f)
except Exception as e:
    print(f"Error loading seed_data.json from {SEED_DATA_PATH}: {e}")
    seed_data = {
        "AGENCIES": [],
        "VENDORS": [],
        "CONTRACT_TYPES": [],
        "DESCRIPTIONS": {}
    }

AGENCIES = seed_data.get("AGENCIES", [])
VENDORS = seed_data.get("VENDORS", [])
CONTRACT_TYPES = seed_data.get("CONTRACT_TYPES", [])
DESCRIPTIONS = seed_data.get("DESCRIPTIONS", {})

def safe_float(val):
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    try:
        cleaned = str(val).replace('$', '').replace(',', '').strip()
        return float(cleaned)
    except Exception:
        return 0.0

def standardize_agency_name(raw_name: str) -> str:
    if not raw_name:
        return random.choice(AGENCIES)
    for a in AGENCIES:
        clean_a = a.split("(")[0].strip().lower()
        raw_name_lower = raw_name.lower()
        if clean_a in raw_name_lower or raw_name_lower in clean_a:
            return a
    # Specific fallbacks
    raw_name_lower = raw_name.lower()
    if "dod" in raw_name_lower or "defense" in raw_name_lower:
        return "Department of Defense (DoD)"
    if "hhs" in raw_name_lower or "health" in raw_name_lower:
        return "Department of Health and Human Services (HHS)"
    if "dot" in raw_name_lower or "transportation" in raw_name_lower:
        return "Department of Transportation (DoT)"
    if "doe" in raw_name_lower or "energy" in raw_name_lower:
        return "Department of Energy (DoE)"
    if "va" in raw_name_lower or "veterans" in raw_name_lower:
        return "Department of Veterans Affairs (VA)"
    if "dhs" in raw_name_lower or "homeland" in raw_name_lower:
        return "Department of Homeland Security (DHS)"
    if "nasa" in raw_name_lower or "aeronautics" in raw_name_lower:
        return "NASA"
    return random.choice(AGENCIES)

def standardize_vendor_name(raw_name: str) -> str:
    if not raw_name:
        return random.choice(VENDORS)
    raw_name_lower = raw_name.lower()
    for v in VENDORS:
        clean_v = v.replace("Corp.", "").replace("Inc.", "").replace("LLP", "").replace("Technologies", "").strip().lower()
        if clean_v in raw_name_lower or raw_name_lower in clean_v:
            return v
    # Specific abbreviations and patterns
    if "lockheed" in raw_name_lower:
        return "Lockheed Martin Corp."
    if "northrop" in raw_name_lower or "grumman" in raw_name_lower:
        return "Northrop Grumman Corp."
    if "pfizer" in raw_name_lower:
        return "Pfizer Inc."
    if "raytheon" in raw_name_lower:
        return "Raytheon Technologies"
    if "mckesson" in raw_name_lower:
        return "McKesson Corp."
    if "general dynamics" in raw_name_lower:
        return "General Dynamics"
    if "deloitte" in raw_name_lower:
        return "Deloitte Consulting LLP"
    if "booz" in raw_name_lower:
        return "Booz Allen Hamilton"
    if "fedex" in raw_name_lower:
        return "FedEx Government Services"
    if "carahsoft" in raw_name_lower:
        return "Carahsoft Technology Corp."
    return raw_name


def fetch_real_awards(limit=300):
    """
    Fetches real contract award records from USAspending.gov.
    Bypasses SSL certification for proxy compatibility.
    """
    import urllib.request
    import json
    import ssl
    
    url = os.getenv("USASPENDING_API_URL", "https://api.usaspending.gov/api/v2/search/spending_by_award/")
    headers = {"Content-Type": "application/json"}
    context = ssl._create_unverified_context()
    
    awards = []
    page = 1
    chunk_size = 100
    
    while len(awards) < limit:
        payload = {
            "filters": {
                "award_type_codes": ["A", "B", "C", "D"],
                "time_period": [{"start_date": "2024-01-01", "end_date": "2025-12-31"}]
            },
            "fields": [
                "Award ID", 
                "Recipient Name", 
                "Award Amount", 
                "Description", 
                "Awarding Agency", 
                "Awarding Sub Agency", 
                "Start Date", 
                "Award Type"
            ],
            "limit": chunk_size,
            "page": page
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, context=context, timeout=8) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                results = res_data.get("results", [])
                if not results:
                    break
                for r in results:
                    if len(awards) >= limit:
                        break
                    awards.append(r)
                page += 1
        except Exception as e:
            print(f"Error fetching from USAspending API on page {page}: {e}")
            break
            
    return awards

def fetch_sam_opportunities(limit=50):
    """
    Fetches real contract opportunities from SAM.gov.
    Bypasses SSL certification for proxy compatibility.
    """
    import urllib.request
    import json
    import ssl
    from datetime import date, timedelta
    
    url = os.getenv("SAM_GOV_API_URL", "https://api.sam.gov/opportunities/v2/search")
    api_key = os.getenv("SAM_GOV_API_KEY", "")
    
    if not api_key:
        print("SAM_GOV_API_KEY is not configured in environment. Skipping SAM.gov fetch.")
        return []
        
    context = ssl._create_unverified_context()
    
    # Form date parameters for query (past 90 days)
    today = date.today()
    start_date = (today - timedelta(days=90)).strftime("%m/%d/%Y")
    end_date = today.strftime("%m/%d/%Y")
    
    full_url = f"{url}?api_key={api_key}&postedFrom={start_date}&postedTo={end_date}&limit={limit}"
    
    try:
        print(f"Requesting SAM.gov API: {url} (limit: {limit})")
        req = urllib.request.Request(full_url, method="GET")
        with urllib.request.urlopen(req, context=context, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            results = res_data.get("opportunitiesData", [])
            return results
    except Exception as e:
        print(f"Error fetching from SAM.gov API: {e}")
        return []

def generate_synthetic_data(db_path: str, num_awards: int = 300):
    """
    Generates realistic, synthetic procurement payment lifecycle records 
    and saves them to a DuckDB database.
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Initialize connection
    conn = duckdb.connect(db_path)
    
    # Drop existing tables
    conn.execute("DROP TABLE IF EXISTS payments;")
    conn.execute("DROP TABLE IF EXISTS invoices;")
    conn.execute("DROP TABLE IF EXISTS awards;")
    
    # Create tables with data_source columns
    conn.execute("""
        CREATE TABLE awards (
            award_id VARCHAR PRIMARY KEY,
            agency_name VARCHAR,
            vendor_name VARCHAR,
            award_date DATE,
            amount DOUBLE,
            contract_type VARCHAR,
            status VARCHAR,
            description VARCHAR,
            data_source VARCHAR
        );
    """)
    
    conn.execute("""
        CREATE TABLE invoices (
            invoice_id VARCHAR PRIMARY KEY,
            award_id VARCHAR,
            invoice_date DATE,
            amount DOUBLE,
            status VARCHAR,
            data_source VARCHAR,
            FOREIGN KEY (award_id) REFERENCES awards(award_id)
        );
    """)
    
    conn.execute("""
        CREATE TABLE payments (
            payment_id VARCHAR PRIMARY KEY,
            invoice_id VARCHAR,
            payment_date DATE,
            amount DOUBLE,
            status VARCHAR,
            completion_days INTEGER,
            data_source VARCHAR,
            FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        );
    """)
    
    start_date = datetime(2024, 1, 1)
    
    awards_data = []
    invoices_data = []
    payments_data = []
    seen_ids = set()
    
    # Try fetching real data from USAspending
    print(f"Attempting to fetch real awards from USAspending.gov (target: {num_awards})...")
    real_records = fetch_real_awards(num_awards)
    print(f"Fetched {len(real_records)} real award records from USAspending.gov.")
    
    # Try fetching real opportunities from SAM.gov
    print("Attempting to fetch real opportunities from SAM.gov...")
    sam_records = fetch_sam_opportunities(limit=50)
    print(f"Fetched {len(sam_records)} real opportunities from SAM.gov.")
    
    for i in range(num_awards):
        # Determine data source mapping: SAM.gov first, then USAspending, then fallback mock
        use_sam = i < len(sam_records)
        use_real = not use_sam and i < (len(sam_records) + len(real_records))

        
        if use_sam:
            r = sam_records[i]
            notice_id = r.get("noticeId") or r.get("solicitationNumber") or str(uuid.uuid4())
            award_id = f"AWD-SAM-{notice_id}"
            
            if award_id in seen_ids:
                counter = 2
                temp_id = f"{award_id}_{counter}"
                while temp_id in seen_ids:
                    counter += 1
                    temp_id = f"{award_id}_{counter}"
                award_id = temp_id
            seen_ids.add(award_id)
            
            # Extract agency
            full_path = r.get("fullParentPathName") or ""
            agency = standardize_agency_name(full_path)
            
            # Extract vendor
            award_info = r.get("award") or {}
            vendor = None
            if isinstance(award_info, dict):
                vendor = (
                    award_info.get("vendorName") or 
                    award_info.get("vendor", {}).get("name") or 
                    award_info.get("awardee", {}).get("name")
                )
            vendor = standardize_vendor_name(vendor)
            
            # Extract date
            try:
                aw_date = datetime.strptime(r.get("postedDate"), "%Y-%m-%d")
            except Exception:
                aw_date = start_date + timedelta(days=random.randint(0, 800))
                
            # Extract amount
            amount = 0.0
            if isinstance(award_info, dict):
                amount = safe_float(award_info.get("amount"))
            if amount <= 0:
                amount = round(random.uniform(50000, 15000000), 2)
                
            # Extract contract type
            contract_type = r.get("type") or r.get("baseType") or ""
            matched = False
            for ct in CONTRACT_TYPES:
                if ct.lower() in str(contract_type).lower():
                    contract_type = ct
                    matched = True
                    break
            if not matched:
                contract_type = random.choice(CONTRACT_TYPES)
                
            desc = r.get("title") or ""
            desc = str(desc).strip()
            if not desc or desc.lower() == "null":
                desc = f"Real opportunity notice under {agency} fetched from SAM.gov."
                
            data_source = "Real (SAM.gov)"
            
        elif use_real:
            # Shift index since real_records starts at 0
            idx = i - len(sam_records)
            r = real_records[idx]
            # Map fields safely
            raw_id = r.get("Award ID")
            award_id = f"AWD-USA-{raw_id}" if raw_id else f"AWD-REAL-{2024 + (i % 3)}-{10000 + i}"
            
            if award_id in seen_ids:
                counter = 2
                temp_id = f"{award_id}_{counter}"
                while temp_id in seen_ids:
                    counter += 1
                    temp_id = f"{award_id}_{counter}"
                award_id = temp_id
            seen_ids.add(award_id)
            
            agency = standardize_agency_name(r.get("Awarding Agency"))
            vendor = standardize_vendor_name(r.get("Recipient Name"))
            
            try:
                aw_date = datetime.strptime(r.get("Start Date"), "%Y-%m-%d")
            except Exception:
                aw_date = start_date + timedelta(days=random.randint(0, 800))
                
            amount = safe_float(r.get("Award Amount"))
            if amount <= 0:
                amount = round(random.uniform(50000, 15000000), 2)
                
            raw_type = r.get("Award Type") or ""
            raw_type_upper = str(raw_type).upper()
            if "COST" in raw_type_upper or "FEE" in raw_type_upper:
                contract_type = "Cost Plus Fixed Fee"
            elif "TIME" in raw_type_upper or "MATERIAL" in raw_type_upper:
                contract_type = "Time and Materials"
            elif "LABOR" in raw_type_upper:
                contract_type = "Labor Hours"
            elif "INDEFINITE" in raw_type_upper or "DELIVERY" in raw_type_upper:
                contract_type = "Indefinite Delivery"
            else:
                matched = False
                for ct in CONTRACT_TYPES:
                    if ct.lower() in str(raw_type).lower():
                        contract_type = ct
                        matched = True
                        break
                if not matched:
                    contract_type = random.choice(CONTRACT_TYPES)
                    
            desc = r.get("Description") or ""
            desc = str(desc).strip()
            if not desc or desc.lower() == "null":
                desc = f"Real procurement of goods/services under {agency}."
                
            data_source = "Real (USAspending.gov)"
        else:
            # Fallback mock generator
            award_id = f"AWD-MOCK-{2024 + (i % 3)}-{10000 + i}"
            agency = random.choice(AGENCIES)
            vendor = random.choice(VENDORS)
            days_offset = random.randint(0, 800)
            aw_date = start_date + timedelta(days=days_offset)
            amount = round(random.uniform(50000, 15000000), 2)
            contract_type = random.choice(CONTRACT_TYPES)
            desc = random.choice(DESCRIPTIONS[vendor])
            data_source = "Real (USAspending.gov - Simulated Fallback)"
            seen_ids.add(award_id)
            
        # Award Status
        if aw_date < datetime(2025, 6, 1):
            status = random.choice(["Completed", "Completed", "Active", "Terminated"])
        else:
            status = "Active"
            
        awards_data.append((
            award_id, agency, vendor, aw_date.date(), amount, contract_type, status, desc, data_source
        ))
        
        # Invoices and payments are synthetic (30% split segment)
        # If Terminated, we might have few or no invoices
        if status == "Terminated":
            num_invoices = random.randint(0, 1)
        else:
            num_invoices = random.randint(1, 5)
            
        total_invoiced = 0.0
        
        for j in range(num_invoices):
            invoice_id = f"INV-{award_id}-{j+1}"
            inv_date = aw_date + timedelta(days=random.randint(15, 60) * (j + 1))
            
            # Ensure it is in the past
            if inv_date > datetime(2026, 6, 21):
                continue
                
            if j == num_invoices - 1:
                inv_amount = round(max(100.0, amount - total_invoiced), 2)
            else:
                inv_amount = round(random.uniform(amount * 0.1, amount * (0.8 / num_invoices)), 2)
                
            total_invoiced += inv_amount
            
            # Invoice Status
            if inv_date < datetime(2026, 5, 1):
                inv_status = random.choice(["Approved", "Approved", "Approved", "Disputed"])
            else:
                inv_status = random.choice(["Approved", "Pending", "Disputed"])
                
            invoices_data.append((
                invoice_id, award_id, inv_date.date(), inv_amount, inv_status, "Synthetic (Simulated)"
            ))
            
            # Payments are based on approved invoices
            if inv_status == "Approved":
                payment_id = f"PAY-{invoice_id}"
                delay_base = 20
                
                if agency == "Department of Defense (DoD)":
                    delay_base += 18
                    if contract_type == "Time and Materials":
                        delay_base += 20
                elif agency == "Department of Veterans Affairs (VA)":
                    delay_base += 12
                elif agency == "Department of Health and Human Services (HHS)":
                    if vendor in ["Pfizer Inc.", "McKesson Corp."]:
                        delay_base -= 10
                    else:
                        delay_base -= 2
                        
                if contract_type == "Cost Plus Fixed Fee":
                    delay_base += 8
                elif contract_type == "Indefinite Delivery":
                    delay_base += 5
                    
                delay_days = max(3, int(random.lognormvariate(0.5, 0.4) * delay_base))
                pay_date = inv_date + timedelta(days=delay_days)
                
                if pay_date > datetime(2026, 6, 21):
                    pay_status = "In Progress"
                    if (datetime(2026, 6, 21) - inv_date).days > 30:
                        pay_status = "Delayed"
                    
                    payments_data.append((
                        payment_id, invoice_id, None, inv_amount, pay_status, None, "Synthetic (Simulated)"
                    ))
                else:
                    pay_status = "Completed"
                    if delay_days > 30:
                        pay_status = "Delayed"
                        
                    payments_data.append((
                        payment_id, invoice_id, pay_date.date(), inv_amount, pay_status, delay_days, "Synthetic (Simulated)"
                    ))
            elif inv_status == "Pending":
                pass
            elif inv_status == "Disputed":
                payment_id = f"PAY-{invoice_id}"
                pay_status = "Delayed"
                payments_data.append((
                    payment_id, invoice_id, None, inv_amount, pay_status, None, "Synthetic (Simulated)"
                ))

    # Insert into DuckDB
    df_awards = pd.DataFrame(awards_data, columns=['award_id', 'agency_name', 'vendor_name', 'award_date', 'amount', 'contract_type', 'status', 'description', 'data_source'])
    df_invoices = pd.DataFrame(invoices_data, columns=['invoice_id', 'award_id', 'invoice_date', 'amount', 'status', 'data_source'])
    df_payments = pd.DataFrame(payments_data, columns=['payment_id', 'invoice_id', 'payment_date', 'amount', 'status', 'completion_days', 'data_source'])
    
    conn.execute("INSERT INTO awards SELECT * FROM df_awards;")
    conn.execute("INSERT INTO invoices SELECT * FROM df_invoices;")
    conn.execute("INSERT INTO payments SELECT * FROM df_payments;")
    
    # Verify Insertion
    print("Database seeding completed.")
    print(f"Awards inserted: {conn.execute('SELECT COUNT(*) FROM awards;').fetchone()[0]}")
    print(f"Invoices inserted: {conn.execute('SELECT COUNT(*) FROM invoices;').fetchone()[0]}")
    print(f"Payments inserted: {conn.execute('SELECT COUNT(*) FROM payments;').fetchone()[0]}")
    
    conn.close()

if __name__ == "__main__":
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "procurement.db"))
    generate_synthetic_data(db_path, num_awards=300)
