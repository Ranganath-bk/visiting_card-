from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import os
import re

# ---------------------------
# OCR (DocTR)
# ---------------------------
from doctr.io import DocumentFile
from doctr.models import ocr_predictor

# ---------------------------
# Excel Export
# ---------------------------
import pandas as pd


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ---------------------------
# Upload + Export folders
# ---------------------------
UPLOAD_FOLDER = "uploads"
EXPORT_FOLDER = "exports"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXPORT_FOLDER, exist_ok=True)

# ---------------------------
# MongoDB connection
# ---------------------------
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["visiting_card_db"]
cards_collection = db["visiting_cards"]

print("✅ Connected DB:", db.name)
print("✅ Collection:", cards_collection.name)
print("✅ Total documents:", cards_collection.count_documents({}))

# ---------------------------
# Load DocTR model ONCE
# ---------------------------
predictor = ocr_predictor(pretrained=True)


# ==========================================================
# Helper Functions (OCR Extraction)
# ==========================================================

def clean_line(line: str) -> str:
    line = line.strip()
    line = re.sub(r"\s+", " ", line)
    return line


def normalize_text(text: str) -> str:
    text = text.replace("Indio", "India")
    text = text.replace("indio", "india")
    text = text.replace("lndia", "India")
    return text


def extract_phone(text: str) -> str:
    text = text.replace("O", "0")
    t = text.replace(",", " ").replace("|", " ").replace("I", " ").replace("l", " ")

    m = re.findall(r"\+91[\s\-]?\d{5}[\s\-]?\d{5}", t)
    if m:
        return re.sub(r"\s|\-", "", m[0])

    m2 = re.findall(r"\+91[\s\-]?\d{10}", t)
    if m2:
        return re.sub(r"\s|\-", "", m2[0])

    m3 = re.findall(r"\b[6-9]\d{9}\b", t)
    if m3:
        return m3[0]

    m4 = re.findall(r"\b0\d{2,4}[-\s]?\d{6,8}\b", t)
    if m4:
        return m4[0].replace(" ", "")

    return ""


def fix_email(email: str) -> str:
    email = email.strip()
    email = email.replace(" ", "")
    email = email.replace(";", "")
    email = email.replace(",", "")
    email = email.replace("..", ".")

    email = email.replace("@gmat.on", "@gmail.com")
    email = email.replace("@gma1l.com", "@gmail.com")
    email = email.replace("gmailcom", "gmail.com")

    if "@gmail." in email and not email.endswith(".com"):
        email = email.split("@gmail")[0] + "@gmail.com"

    return email


def extract_email(text: str) -> str:
    matches = re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)

    if not matches:
        return ""

    fixed = [fix_email(m) for m in matches]

    generic_domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com"]

    for e in fixed:
        domain = e.split("@")[-1].lower()
        if domain not in generic_domains:
            return e

    return fixed[0]


def extract_website(text: str, email: str) -> str:
    t = text.lower()
    t = t.replace("www ", "www.")
    t = t.replace("http ://", "http://")
    t = t.replace("https ://", "https://")

    patterns = [
        r"(https?://[a-z0-9\-\.]+\.[a-z]{2,}(/[a-z0-9\-/]*)?)",
        r"(www\.[a-z0-9\-]+\.[a-z]{2,}(/[a-z0-9\-/]*)?)",
        r"([a-z0-9\-]{2,}\.(com|in|net|org|co\.in|co|info|biz))"
    ]

    found = []
    for p in patterns:
        matches = re.findall(p, t)
        for m in matches:
            site = m[0] if isinstance(m, tuple) else m
            site = site.strip().replace(" ", "")

            if "@" in site:
                continue

            if site in ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]:
                continue

            found.append(site)

    found = list(dict.fromkeys(found))

    if not found:
        return "-"

    if email and "@" in email:
        email_domain = email.split("@")[-1].lower().strip()
        found = [w for w in found if email_domain not in w]

    if not found:
        return "-"

    site = found[0]
    site = site.replace("https://", "")
    site = site.replace("http://", "")

    return site


def extract_city(text: str) -> str:
    m = re.search(r"\b([A-Za-z]{3,20})\s*[-,]?\s*\d{6}\b", text)
    if m:
        return m.group(1).strip().title()

    common = [
        "delhi", "new delhi", "chennai", "mumbai", "hyderabad", "pune",
        "kochi", "bengaluru", "bangalore", "kolkata", "ahmedabad",
        "jaipur", "lucknow", "indore", "bhopal", "nagpur", "mysuru", "mysore"
    ]

    low = text.lower()
    for c in common:
        if c in low:
            return c.title()

    return ""


def looks_like_company(line: str) -> bool:
    l = line.lower()
    keywords = [
        "limited", "ltd", "pvt", "private",
        "technology", "technologies",
        "corporation", "industries", "industry",
        "solutions", "systems", "group", "services",
        "enterprises", "electronics", "electro"
    ]
    if any(k in l for k in keywords):
        return True

    if len(line.split()) >= 2 and line.upper() == line and len(line) >= 8:
        return True

    return False


def looks_like_name(line: str) -> bool:
    if len(line) < 3:
        return False

    if any(ch.isdigit() for ch in line):
        return False

    low = line.lower()

    if "@" in line or "www" in low or ".com" in low or ".in" in low:
        return False

    if looks_like_company(line):
        return False

    reject = [
        "manager", "general", "engineer", "director", "sales", "marketing",
        "hr", "solution", "solutions", "corporation", "industrial",
        "technology", "limited", "ltd", "pvt", "private"
    ]
    if any(r in low for r in reject):
        return False

    parts = re.findall(r"[A-Za-z]+", line)
    if len(parts) < 1:
        return False

    if "." in line or "-" in line:
        if len(parts) >= 2:
            return True

    if 2 <= len(parts) <= 4:
        return True

    return False


def extract_name_and_company(lines):
    cleaned = []
    for ln in lines:
        ln = clean_line(ln)
        if not ln:
            continue

        low = ln.lower()

        if "@" in ln:
            continue

        if "www" in low or ".com" in low or ".in" in low:
            continue

        if re.search(r"\d{6,}", ln):
            continue

        cleaned.append(ln)

    top = cleaned[:18]

    name = ""
    company = ""

    for ln in top:
        if looks_like_company(ln):
            company = ln.strip().upper()
            break

    for ln in top:
        if looks_like_name(ln):
            name = ln.strip().title()
            break

    if not company:
        for ln in top:
            if ln.upper() == ln and len(ln) >= 4:
                if name and ln.lower() in name.lower():
                    continue
                company = ln.upper()
                break

    return name, company


def doctr_extract_text(image_path: str) -> str:
    doc = DocumentFile.from_images(image_path)
    result = predictor(doc)
    return result.render()


# ==========================================================
# Routes
# ==========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Visiting Card MongoDB + OCR backend running"}), 200


@app.route("/api/debug/count", methods=["GET"])
def debug_count():
    return jsonify({
        "db": db.name,
        "collection": cards_collection.name,
        "total_docs": cards_collection.count_documents({}),
        "active_docs": cards_collection.count_documents({
            "$or": [
                {"isDeleted": False},
                {"isDeleted": {"$exists": False}}
            ]
        }),
        "deleted_docs": cards_collection.count_documents({"isDeleted": True})
    }), 200


# ✅ OCR Scan
@app.route("/scan", methods=["POST"])
def scan_card():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    if image_file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, image_file.filename)
    image_file.save(file_path)

    try:
        ocr_text = doctr_extract_text(file_path)
        ocr_text = normalize_text(ocr_text)

        lines = [clean_line(x) for x in ocr_text.split("\n") if clean_line(x)]

        phone = extract_phone(ocr_text)
        email = extract_email(ocr_text)
        city = extract_city(ocr_text)
        name, company = extract_name_and_company(lines)
        website = extract_website(ocr_text, email)

        extracted_data = {
            "name": name,
            "company": company,
            "phone": phone,
            "email": email,
            "website": website,
            "city": city,
        }

        return jsonify(extracted_data), 200

    except Exception as e:
        return jsonify({"error": f"OCR processing failed: {str(e)}"}), 500


# ✅ SAVE card
@app.route("/cards", methods=["POST"])
def save_card():
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    data["isDeleted"] = False
    data["createdAt"] = datetime.utcnow()

    cards_collection.insert_one(data)
    return jsonify({"message": "Data stored successfully"}), 201


# ✅ FETCH ACTIVE cards (Report page)
@app.route("/api/cards", methods=["GET"])
def get_cards():
    search = request.args.get("search", "").strip()

    base_active_query = {
        "$or": [
            {"isDeleted": False},
            {"isDeleted": {"$exists": False}}
        ]
    }

    if search:
        query = {
            "$and": [
                base_active_query,
                {
                    "$or": [
                        {"name": {"$regex": search, "$options": "i"}},
                        {"company": {"$regex": search, "$options": "i"}},
                        {"city": {"$regex": search, "$options": "i"}},
                        {"email": {"$regex": search, "$options": "i"}},
                        {"phone": {"$regex": search, "$options": "i"}},
                    ]
                }
            ]
        }
    else:
        query = base_active_query

    cards = []
    for card in cards_collection.find(query).sort("createdAt", -1):
        card["_id"] = str(card["_id"])
        cards.append(card)

    return jsonify(cards), 200


# ✅ FETCH DELETED cards
@app.route("/api/deleted", methods=["GET"])
@app.route("/api/cards/deleted", methods=["GET"])
def get_deleted_cards():
    cards = []
    for card in cards_collection.find({"isDeleted": True}).sort("updatedAt", -1):
        card["_id"] = str(card["_id"])
        cards.append(card)
    return jsonify(cards), 200


# ✅ UPDATE card
@app.route("/api/cards/<card_id>", methods=["PUT"])
def update_card(card_id):
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    update_data = {
        "name": data.get("name", ""),
        "company": data.get("company", ""),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "website": data.get("website", ""),
        "city": data.get("city", ""),
        "updatedAt": datetime.utcnow()
    }

    result = cards_collection.update_one(
        {"_id": ObjectId(card_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Card not found"}), 404

    return jsonify({"message": "Card updated successfully"}), 200


# ✅ DELETE card (SOFT DELETE)
@app.route("/api/cards/<card_id>", methods=["DELETE"])
def delete_card(card_id):
    result = cards_collection.update_one(
        {"_id": ObjectId(card_id)},
        {"$set": {"isDeleted": True, "updatedAt": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Card not found"}), 404

    return jsonify({"message": "Card moved to deleted records (isDeleted=true)"}), 200


# ✅ RESTORE deleted record (SOFT RESTORE)
@app.route("/api/deleted/restore/<card_id>", methods=["POST"])
@app.route("/api/cards/restore/<card_id>", methods=["POST"])
def restore_card(card_id):
    result = cards_collection.update_one(
        {"_id": ObjectId(card_id)},
        {"$set": {"isDeleted": False, "updatedAt": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Card not found"}), 404

    return jsonify({"message": "Card restored successfully (isDeleted=false)"}), 200


# ✅ EXPORT ACTIVE CARDS TO EXCEL
@app.route("/api/export/excel", methods=["GET"])
def export_active_cards_excel():
    try:
        cards = list(cards_collection.find({
            "$or": [
                {"isDeleted": False},
                {"isDeleted": {"$exists": False}}
            ]
        }).sort("createdAt", -1))

        export_rows = []
        for c in cards:
            export_rows.append({
                "Name": c.get("name", ""),
                "Company": c.get("company", ""),
                "Phone": c.get("phone", ""),
                "Email": c.get("email", ""),
                "Website": c.get("website", ""),
                "City": c.get("city", ""),
                "Created At": str(c.get("createdAt", "")),
            })

        df = pd.DataFrame(export_rows)

        file_path = os.path.join(EXPORT_FOLDER, "visiting_cards_report.xlsx")
        df.to_excel(file_path, index=False)

        return send_file(
            file_path,
            as_attachment=True,
            download_name="visiting_cards_report.xlsx"
        )

    except Exception as e:
        return jsonify({"error": f"Excel export failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
