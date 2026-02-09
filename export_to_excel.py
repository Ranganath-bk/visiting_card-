from pymongo import MongoClient
import pandas as pd
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["visiting_card_db"]
collection = db["visiting_cards"]

records = []

for doc in collection.find({}, {"_id": 0}):
    records.append({
        "name": doc.get("name", ""),
        "company": doc.get("company", ""),
        "phone": doc.get("phone", ""),
        "email": doc.get("email", ""),
        "website": doc.get("website", ""),
        "city": doc.get("city", ""),
        "createdAt": doc.get("createdAt", "")
    })

df = pd.DataFrame(records)

filename = f"visiting_cards_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
df.to_excel(filename, index=False)

print(f"Exported {len(records)} records to {filename}")
