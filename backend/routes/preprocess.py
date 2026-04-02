from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List

import pandas as pd
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "or_data.csv"
PROCESSED_PATH = BASE_DIR / "data" / "processed_data.json"
MODEL_PATH = BASE_DIR / "models" / "gnn_weights.pt"

NORMALIZE_MAP = {
    "lap chole": "Laparoscopic Cholecystectomy",
    "tkr": "Total Knee Replacement",
    "append.": "Appendectomy",
    "cabg": "Coronary Artery Bypass",
    "hip rep": "Hip Replacement",
    "cranio": "Craniotomy",
    "hysterec.": "Hysterectomy",
    "prostat.": "Prostatectomy",
    "tonsil": "Tonsillectomy",
    "cataract": "Cataract Surgery",
    "colect.": "Colectomy",
    "hernia rep": "Hernia Repair",
    "thyroid": "Thyroidectomy",
    "mastec.": "Mastectomy",
    "spinal fuse": "Spinal Fusion",
    "nephrect.": "Nephrectomy",
    "carpal": "Carpal Tunnel Release",
    "rotator": "Rotator Cuff Repair",
    "acl recon": "ACL Reconstruction",
    "bowel res": "Bowel Resection",
    "septo": "Septoplasty",
    "varico": "Varicocelectomy",
    "gastric": "Gastric Bypass",
    "c-section": "Caesarean Section",
}


def _mock_normalize(df: pd.DataFrame) -> List[dict]:
    records = []
    for _, row in df.iterrows():
        raw_name = str(row["procedure_name"]).strip().lower()
        normalized = NORMALIZE_MAP.get(raw_name, str(row["procedure_name"]).title())
        records.append(
            {
                "case_id": int(row["case_id"]),
                "surgeon_id": row["surgeon_id"],
                "anaesthetist_id": row["anaesthetist_id"],
                "scrub_nurse_id": row["scrub_nurse_id"],
                "procedure_normalized": normalized,
                "duration_est_mins": float(row["actual_duration_mins"] or row["scheduled_duration_mins"]),
                "complexity": int(row["complexity"]),
                "outcome_score": float(row["outcome_score"]),
                "or_room": row["or_room"],
                "hospital_id": row["hospital_id"],
                "specialty": row["specialty"],
            }
        )
    return records


@router.get("/status")
def status():
    return {
        "has_raw_data": DATA_PATH.exists(),
        "has_processed": PROCESSED_PATH.exists(),
        "has_model": MODEL_PATH.exists(),
    }


@router.post("/preprocess")
def preprocess(limit: int = Query(default=500, ge=50, le=5000)):
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Raw data not found. Run data/generate_synthetic.py")

    df = pd.read_csv(DATA_PATH).head(limit)
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key or OpenAI is None:
        processed = _mock_normalize(df)
        PROCESSED_PATH.write_text(json.dumps(processed, indent=2))
        return {"status": "done", "records_processed": len(processed), "sample": processed[:3]}

    client = OpenAI(api_key=api_key)
    system_prompt = (
        "You are a medical data normaliser for OR scheduling research."
        " Given raw OR records as JSON, return a JSON array (no markdown, no"
        " explanation, ONLY the array) where each element has:"
        " case_id, surgeon_id, anaesthetist_id, scrub_nurse_id,"
        " procedure_normalized (standard medical name, fix typos and"
        " abbreviations), duration_est_mins (use actual_duration_mins if"
        " available, else scheduled), complexity (int 1-5),"
        " outcome_score (float 1-10), or_room, hospital_id, specialty"
    )

    processed: List[dict] = []
    rows = df.to_dict(orient="records")

    for start in range(0, len(rows), 50):
        batch = rows[start : start + 50]
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(batch)},
                ],
                temperature=0.2,
            )
            text = response.choices[0].message.content
            processed.extend(json.loads(text))
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"LLM preprocessing failed: {exc}")

    PROCESSED_PATH.write_text(json.dumps(processed, indent=2))
    return {"status": "done", "records_processed": len(processed), "sample": processed[:3]}
