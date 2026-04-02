from __future__ import annotations

import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

OUTPUT_PATH = Path(__file__).resolve().parent / "or_data.csv"

PROCEDURES = [
    ("Laparoscopic Cholecystectomy", 75, 18),
    ("Total Knee Replacement", 105, 22),
    ("Appendectomy", 55, 15),
    ("Coronary Artery Bypass", 240, 45),
    ("Hip Replacement", 95, 20),
    ("Craniotomy", 210, 50),
    ("Hysterectomy", 90, 25),
    ("Prostatectomy", 130, 30),
    ("Tonsillectomy", 35, 10),
    ("Cataract Surgery", 25, 8),
    ("Colectomy", 150, 35),
    ("Hernia Repair", 65, 18),
    ("Thyroidectomy", 80, 20),
    ("Mastectomy", 100, 25),
    ("Spinal Fusion", 195, 40),
    ("Nephrectomy", 140, 30),
    ("Carpal Tunnel Release", 30, 8),
    ("Rotator Cuff Repair", 85, 20),
    ("ACL Reconstruction", 90, 22),
    ("CABG", 255, 50),
    ("Bowel Resection", 165, 38),
    ("Septoplasty", 45, 12),
    ("Varicocelectomy", 50, 14),
    ("Gastric Bypass", 180, 40),
    ("Caesarean Section", 50, 12),
]

SPECIALTIES = [
    "General Surgery",
    "Orthopaedics",
    "Cardiothoracic",
    "Neurosurgery",
    "Urology",
    "Gynaecology",
    "ENT",
    "Plastics",
]

FIRST_NAMES = [
    "Asha", "Ravi", "Meera", "Kiran", "Sonia", "Amit", "Priya", "Arjun",
    "Neha", "Rahul", "Isha", "Vikram", "Diya", "Rohan", "Anita", "Kabir",
]

LAST_NAMES = [
    "Sharma", "Patel", "Iyer", "Gupta", "Nair", "Reddy", "Kapoor", "Bose",
    "Mehta", "Chandra", "Verma", "Joshi", "Menon", "Sengupta", "Desai",
]

ABBREV = {
    "Laparoscopic Cholecystectomy": "Lap Chole",
    "Total Knee Replacement": "TKR",
    "Appendectomy": "Append.",
    "Coronary Artery Bypass": "CABG",
    "Hip Replacement": "Hip Rep",
    "Craniotomy": "Cranio",
    "Hysterectomy": "Hysterec.",
    "Prostatectomy": "Prostat.",
    "Tonsillectomy": "Tonsil",
    "Cataract Surgery": "Cataract",
    "Colectomy": "Colect.",
    "Hernia Repair": "Hernia Rep",
    "Thyroidectomy": "Thyroid",
    "Mastectomy": "Mastec.",
    "Spinal Fusion": "Spinal Fuse",
    "Nephrectomy": "Nephrect.",
    "Carpal Tunnel Release": "Carpal",
    "Rotator Cuff Repair": "Rotator",
    "ACL Reconstruction": "ACL Recon",
    "Bowel Resection": "Bowel Res",
    "Septoplasty": "Septo",
    "Varicocelectomy": "Varico",
    "Gastric Bypass": "Gastric",
    "Caesarean Section": "C-Section",
}


def random_date(start: datetime, end: datetime) -> datetime:
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))


def messy_name(name: str) -> str:
    roll = random.random()
    if roll < 0.30:
        return ABBREV.get(name, name)
    if roll < 0.50:
        return name.upper()
    if roll < 0.65:
        pos = random.randint(0, max(len(name) - 2, 0))
        if len(name) >= 2:
            chars = list(name)
            chars[pos], chars[pos + 1] = chars[pos + 1], chars[pos]
            return "".join(chars)
    if roll < 0.80:
        return name.replace(" ", "  ")
    return name


def main():
    random.seed(42)
    np.random.seed(42)

    surgeons = [f"S{idx:03d}" for idx in range(1, 81)]
    anaesthetists = [f"A{idx:03d}" for idx in range(1, 41)]
    nurses = [f"N{idx:03d}" for idx in range(1, 61)]
    or_rooms = [f"OR-{idx:02d}" for idx in range(1, 16)]
    hospitals = [f"H{idx:02d}" for idx in range(1, 7)]

    start_date = datetime(2021, 1, 1)
    end_date = datetime(2024, 12, 31)

    rows = []
    for case_id in range(12_000):
        procedure_name, mean_dur, std_dur = random.choice(PROCEDURES)
        surgeon_id = random.choice(surgeons)
        anaesthetist_id = random.choice(anaesthetists)
        scrub_nurse_id = random.choice(nurses)
        specialty = random.choice(SPECIALTIES)
        surgeon_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

        scheduled = max(10, random.gauss(mean_dur, std_dur * 0.3))
        actual = max(10, random.gauss(scheduled, 15))

        complexity = random.choices([1, 2, 3, 4, 5], weights=[1, 3, 4, 2, 1])[0]
        outcome_score = np.clip(np.random.normal(9 - complexity, 0.9), 1.0, 10.0)

        rows.append(
            {
                "case_id": case_id,
                "date": random_date(start_date, end_date).strftime("%Y-%m-%d"),
                "surgeon_id": surgeon_id,
                "surgeon_name": surgeon_name,
                "specialty": specialty,
                "anaesthetist_id": anaesthetist_id,
                "scrub_nurse_id": scrub_nurse_id,
                "procedure_code": f"PROC_{random.randint(1, 25):03d}",
                "procedure_name": messy_name(procedure_name),
                "scheduled_duration_mins": round(scheduled, 1),
                "actual_duration_mins": round(actual, 1),
                "complexity": int(complexity),
                "outcome_score": float(round(outcome_score, 2)),
                "or_room": random.choice(or_rooms),
                "hospital_id": random.choice(hospitals),
                "team_size": 3,
            }
        )

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Generated 12000 rows -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
