from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.models.graph_builder import build_synergy_graph

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_PATH = BASE_DIR / "data" / "processed_data.json"


@router.get("/graph-data")
def graph_data():
    if not PROCESSED_PATH.exists():
        raise HTTPException(status_code=404, detail="Processed data not found. Run /api/preprocess")

    processed = json.loads(PROCESSED_PATH.read_text())
    graph_bundle = build_synergy_graph(processed)
    g = graph_bundle["nx_graph"]

    nodes = [
        {
            "id": node_id,
            "role": g.nodes[node_id]["role"],
            "num_cases": g.nodes[node_id]["num_cases"],
            "avg_outcome": g.nodes[node_id]["avg_outcome"],
            "avg_complexity": g.nodes[node_id]["avg_complexity"],
        }
        for node_id in g.nodes()
    ]

    edges = [
        {
            "source": a,
            "target": b,
            "weight": data["weight"],
            "co_occurrence": data["co_occurrence"],
        }
        for a, b, data in g.edges(data=True)
    ]

    return {"nodes": nodes, "edges": edges, "stats": graph_bundle["stats"]}
