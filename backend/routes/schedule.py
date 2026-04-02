from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

import numpy as np
import torch
from fastapi import APIRouter, HTTPException

from backend.models.gnn_model import SurgicalSynergyGNN
from backend.models.graph_builder import build_synergy_graph

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_PATH = BASE_DIR / "data" / "processed_data.json"
WEIGHTS_PATH = BASE_DIR / "models" / "gnn_weights.pt"


def _load_processed() -> List[dict]:
    if not PROCESSED_PATH.exists():
        raise HTTPException(status_code=404, detail="Processed data not found. Run /api/preprocess")
    return json.loads(PROCESSED_PATH.read_text())


def _format_time(base: datetime, minutes: float) -> str:
    return (base + timedelta(minutes=minutes)).strftime("%H:%M")


@router.post("/schedule")
def schedule(payload: dict):
    data = _load_processed()
    date = payload.get("date")
    num_cases = int(payload.get("num_cases", 20))

    if date:
        filtered = [row for row in data if row.get("date") == date]
        if not filtered:
            filtered = data
    else:
        filtered = data

    sample = random.sample(filtered, min(num_cases, len(filtered)))

    graph_bundle = build_synergy_graph(data)
    pyg_data = graph_bundle["pyg_data"]
    node_index = graph_bundle["node_index"]
    g = graph_bundle["nx_graph"]

    if WEIGHTS_PATH.exists():
        model = SurgicalSynergyGNN(input_dim=pyg_data.x.shape[1])
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
        model.eval()
    else:
        model = None

    team_indices = []
    for row in sample:
        team_indices.append(
            [
                node_index[row["surgeon_id"]],
                node_index[row["anaesthetist_id"]],
                node_index[row["scrub_nurse_id"]],
            ]
        )

    team_tensor = torch.tensor(team_indices, dtype=torch.long)

    if model is not None:
        with torch.no_grad():
            _, preds = model(pyg_data, team_tensor)
        pred_list = preds.tolist()
    else:
        pred_list = [row["duration_est_mins"] for row in sample]

    cases = []
    for row, pred in zip(sample, pred_list):
        edges = [
            g.get_edge_data(row["surgeon_id"], row["anaesthetist_id"]),
            g.get_edge_data(row["surgeon_id"], row["scrub_nurse_id"]),
            g.get_edge_data(row["anaesthetist_id"], row["scrub_nurse_id"]),
        ]
        synergy_weights = [edge["weight"] for edge in edges if edge]
        synergy_score = float(sum(synergy_weights) / max(len(synergy_weights), 1))
        risk_level = "high" if synergy_score < 0.4 else "medium" if synergy_score < 0.65 else "low"
        cases.append({
            "case_id": row["case_id"],
            "surgeon_id": row["surgeon_id"],
            "anaesthetist_id": row["anaesthetist_id"],
            "scrub_nurse_id": row["scrub_nurse_id"],
            "procedure": row["procedure_normalized"],
            "predicted_duration_mins": float(round(pred, 1)),
            "team_synergy_score": float(round(synergy_score, 3)),
            "risk_level": risk_level,
        })

    cases.sort(key=lambda x: x["predicted_duration_mins"], reverse=True)

    rooms = [f"OR-{idx:02d}" for idx in range(1, 16)]
    room_available = {room: 0.0 for room in rooms}
    base_time = datetime.strptime("07:00", "%H:%M")

    schedule_rows = []
    for case in cases:
        room = min(room_available, key=room_available.get)
        start_min = room_available[room]
        end_min = start_min + case["predicted_duration_mins"]
        room_available[room] = end_min

        schedule_rows.append(
            {
                **case,
                "or_room": room,
                "start_time": _format_time(base_time, start_min),
                "end_time": _format_time(base_time, end_min),
            }
        )

    max_minutes = 12 * 60
    total_capacity = len(rooms) * max_minutes
    total_duration = sum(case["predicted_duration_mins"] for case in cases)
    total_idle = max(0.0, total_capacity - total_duration)
    utilisation = min(total_duration, total_capacity)
    utilisation_pct = (utilisation / total_capacity) * 100

    metrics = {
        "total_cases_scheduled": len(schedule_rows),
        "total_idle_time_mins": int(total_idle),
        "avg_team_synergy": float(np.mean([c["team_synergy_score"] for c in schedule_rows])),
        "high_risk_cases": sum(1 for c in schedule_rows if c["risk_level"] == "high"),
        "utilisation_pct": float(round(utilisation_pct, 2)),
    }

    return {"date": date or "random", "schedule": schedule_rows, "metrics": metrics}
