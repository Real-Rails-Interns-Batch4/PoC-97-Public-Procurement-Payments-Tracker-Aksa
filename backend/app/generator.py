import os
import random
import uuid
import duckdb
import pandas as pd
from datetime import datetime, timedelta

# Realistic Agencies and Vendors
AGENCIES = [
    "Department of Defense (DoD)",
    "Department of Health and Human Services (HHS)",
    "Department of Transportation (DoT)",
    "Department of Energy (DoE)",
    "Department of Veterans Affairs (VA)",
    "Department of Homeland Security (DHS)",
    "NASA"
]

VENDORS = [
    "Lockheed Martin Corp.",
    "Northrop Grumman Corp.",
    "Pfizer Inc.",
    "Raytheon Technologies",
    "McKesson Corp.",
    "General Dynamics",
    "Deloitte Consulting LLP",
    "Booz Allen Hamilton",
    "FedEx Government Services",
    "Carahsoft Technology Corp."
]

CONTRACT_TYPES = [
    "Firm Fixed Price",
    "Cost Plus Fixed Fee",
    "Time and Materials",
    "Labor Hours",
    "Indefinite Delivery"
]

DESCRIPTIONS = {
    "Lockheed Martin Corp.": [
        "Tactical aircraft maintenance and support",
        "Next-generation missile defense research",
        "Advanced avionics system integration",
        "Satellite communications upgrade"
    ],
    "Northrop Grumman Corp.": [
        "Autonomous surveillance drone development",
        "Cybersecurity defense operations support",
        "Radar system modernization",
        "B-2 Spirit heavy bomber logistics"
    ],
    "Pfizer Inc.": [
        "National vaccine distribution and logistics",
        "Pharmaceutical research and stockpiling",
        "Pediatric therapeutic trial program",
        "Emergency antiviral deployment"
    ],
    "Raytheon Technologies": [
        "Air-to-air missile guidance overhaul",
        "Radar transceiver system deployment",
        "Cyber threat analysis and mitigation",
        "Command and control software maintenance"
    ],
    "McKesson Corp.": [
        "Medical equipment supply for VA clinics",
        "Pharmaceutical wholesale distribution",
        "National health reserve logistics",
        "Telehealth clinical software integration"
    ],
    "General Dynamics": [
        "Navy submarine construction engineering",
        "Armored combat vehicle upgrades",
        "IT infrastructure cloud modernization",
        "Tactical communication network support"
    ],
    "Deloitte Consulting LLP": [
        "Enterprise resource planning modernization",
        "Agency procurement workflow optimization",
        "Financial audit readiness support",
        "Data analytics platform implementation"
    ],
    "Booz Allen Hamilton": [
        "AI-driven predictive threat analytics",
        "Defense logistics optimization consulting",
        "Cloud migration strategy and deployment",
        "Quantum computing research support"
    ],
    "FedEx Government Services": [
        "Express mail courier transport logistics",
        "Cold chain medical supply distribution",
        "Critical defense parts priority shipping",
        "Global courier and tracking services"
    ],
    "Carahsoft Technology Corp.": [
        "Enterprise software license subscription",
        "SaaS cloud collaboration platform",
        "Database administration tools licensing",
        "Endpoint cybersecurity software suite"
    ]
}

def generate_synthetic_data(db_path: str, num_awards: int = 250):
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
    
    # Create tables
    conn.execute("""
        CREATE TABLE awards (
            award_id VARCHAR PRIMARY KEY,
            agency_name VARCHAR,
            vendor_name VARCHAR,
            award_date DATE,
            amount DOUBLE,
            contract_type VARCHAR,
            status VARCHAR,
            description VARCHAR
        );
    """)
    
    conn.execute("""
        CREATE TABLE invoices (
            invoice_id VARCHAR PRIMARY KEY,
            award_id VARCHAR,
            invoice_date DATE,
            amount DOUBLE,
            status VARCHAR,
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
            FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        );
    """)
    
    start_date = datetime(2024, 1, 1)
    
    awards_data = []
    invoices_data = []
    payments_data = []
    
    for i in range(num_awards):
        award_id = f"AWD-{2024 + (i % 3)}-{10000 + i}"
        agency = random.choice(AGENCIES)
        vendor = random.choice(VENDORS)
        
        # Award Date: Random date between start_date and 1.5 years later
        days_offset = random.randint(0, 800)
        aw_date = start_date + timedelta(days=days_offset)
        
        # Award Amount: log-normal distribution or wide range
        amount = round(random.uniform(50000, 15000000), 2)
        contract_type = random.choice(CONTRACT_TYPES)
        
        # Award Status
        if aw_date < datetime(2025, 6, 1):
            status = random.choice(["Completed", "Completed", "Active", "Terminated"])
        else:
            status = "Active"
            
        desc = random.choice(DESCRIPTIONS[vendor])
        
        awards_data.append((
            award_id, agency, vendor, aw_date.date(), amount, contract_type, status, desc
        ))
        
        # If Terminated, we might have few or no invoices
        if status == "Terminated":
            num_invoices = random.randint(0, 1)
        else:
            num_invoices = random.randint(1, 5)
            
        total_invoiced = 0.0
        
        for j in range(num_invoices):
            invoice_id = f"INV-{award_id}-{j+1}"
            
            # Invoice date spaced out after award date
            inv_date = aw_date + timedelta(days=random.randint(15, 60) * (j + 1))
            
            # Ensure it is in the past
            if inv_date > datetime(2026, 6, 21):
                continue
                
            # Last invoice sweeps the rest of the contract amount or is partial
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
                invoice_id, award_id, inv_date.date(), inv_amount, inv_status
            ))
            
            # Payments are based on approved invoices
            if inv_status == "Approved":
                payment_id = f"PAY-{invoice_id}"
                
                # Introduce delay bottlenecks based on Agency and Contract Type
                # Average delay base is 20 days.
                delay_base = 20
                
                # Department of Defense (DoD) has higher audit bottlenecks, especially for Time & Materials
                if agency == "Department of Defense (DoD)":
                    delay_base += 18
                    if contract_type == "Time and Materials":
                        delay_base += 20
                elif agency == "Department of Veterans Affairs (VA)":
                    delay_base += 12
                elif agency == "Department of Health and Human Services (HHS)":
                    # HHS pays fast for medical suppliers
                    if vendor in ["Pfizer Inc.", "McKesson Corp."]:
                        delay_base -= 10
                    else:
                        delay_base -= 2
                        
                # Certain contract types are slower
                if contract_type == "Cost Plus Fixed Fee":
                    delay_base += 8
                elif contract_type == "Indefinite Delivery":
                    delay_base += 5
                    
                # Add random variance (log-normal like distribution)
                delay_days = max(3, int(random.lognormvariate(0.5, 0.4) * delay_base))
                
                pay_date = inv_date + timedelta(days=delay_days)
                
                # If payment date is in the future relative to current date (2026-06-21), it is "In Progress"
                if pay_date > datetime(2026, 6, 21):
                    # It's in progress
                    pay_status = "In Progress"
                    # If invoice was approved more than 30 days ago, it's flagged as Delayed In Progress
                    if (datetime(2026, 6, 21) - inv_date).days > 30:
                        pay_status = "Delayed"
                    
                    payments_data.append((
                        payment_id, invoice_id, None, inv_amount, pay_status, None
                    ))
                else:
                    # Payment is completed
                    pay_status = "Completed"
                    if delay_days > 30:
                        pay_status = "Delayed"
                        
                    payments_data.append((
                        payment_id, invoice_id, pay_date.date(), inv_amount, pay_status, delay_days
                    ))
            elif inv_status == "Pending":
                # No payment entry yet or In Progress/Unpaid
                pass
            elif inv_status == "Disputed":
                # Marked as in progress or delayed depending on date
                payment_id = f"PAY-{invoice_id}"
                pay_status = "Delayed"
                payments_data.append((
                    payment_id, invoice_id, None, inv_amount, pay_status, None
                ))

    # Insert into DuckDB
    # Convert lists to Pandas DataFrames and insert
    df_awards = pd.DataFrame(awards_data, columns=['award_id', 'agency_name', 'vendor_name', 'award_date', 'amount', 'contract_type', 'status', 'description'])
    df_invoices = pd.DataFrame(invoices_data, columns=['invoice_id', 'award_id', 'invoice_date', 'amount', 'status'])
    df_payments = pd.DataFrame(payments_data, columns=['payment_id', 'invoice_id', 'payment_date', 'amount', 'status', 'completion_days'])
    
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
