import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.services.seed_data import seed_initial_doctors

def main():
    print("Initializing MediKiosk Database Tables & Seeding Doctors...")
    init_db()
    db = SessionLocal()
    try:
        seed_initial_doctors(db)
        print("Hospital Doctor Seeding Complete! Ready for Hackathon.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
