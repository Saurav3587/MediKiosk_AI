import sys
import os
import sqlite3

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def clean_database(db_path):
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return
    print(f"Cleaning patient records from {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    tables = [
        "transcript_turns",
        "timeline_events",
        "medical_documents",
        "clinical_histories",
        "patients"
    ]
    for table in tables:
        try:
            cur.execute(f"DELETE FROM {table};")
            print(f"  - Cleared {table}")
        except Exception as e:
            print(f"  - Warning on {table}: {e}")
    conn.commit()
    conn.close()
    print(f"Cleaned {db_path} successfully.\n")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "medikiosk.db")
    root_db = os.path.join(root_dir, "medikiosk.db")
    
    clean_database(backend_db)
    clean_database(root_db)
    print("All patient tables successfully wiped clean! Ready for real patients.")

if __name__ == "__main__":
    main()
