from __future__ import annotations

import json
import os
from dotenv import load_dotenv
from fastapi import APIRouter

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None

router = APIRouter()


@router.post("/explain")
def explain(payload: dict):
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key or OpenAI is None:
        risk_level = "high" if payload.get("risk_flag") else "low"
        return {
            "risk_level": risk_level,
            "rationale": "High risk flagged due to low synergy or wide confidence interval." if risk_level == "high" else "No significant risk signals detected.",
            "suggested_adjustment": "Consider swapping scrub nurse for a higher synergy pairing." if risk_level == "high" else None,
            "reweight_edges": [],
            "re_predict": risk_level == "high",
        }

    client = OpenAI(api_key=api_key)
    system_prompt = (
        "You are an expert OR scheduling AI assistant at a hospital."
        " Analyse this surgical team prediction and return ONLY a JSON object"
        " (no markdown) with keys: risk_level (low/medium/high),"
        " rationale (2-3 sentence plain English explanation of risks),"
        " suggested_adjustment (string or null), reweight_edges"
        " (array of {staff_id_1, staff_id_2, adjustment_factor} only if risk_level"
        " is high, else empty array)."
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(payload)},
        ],
        temperature=0.2,
    )

    parsed = json.loads(response.choices[0].message.content)
    parsed["re_predict"] = parsed.get("risk_level") == "high" and bool(parsed.get("reweight_edges"))
    return parsed
