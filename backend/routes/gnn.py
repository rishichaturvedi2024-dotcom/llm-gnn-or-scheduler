from __future__ import annotations

import json
from pathlib import Path
from typing import List

import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException

from backend.models.gnn_model import SurgicalSynergyGNN
from backend.models.graph_builder import build_synergy_graph

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_PATH = BASE_DIR / "data" / "processed_data.json"
WEIGHTS_PATH = BASE_DIR / "models" / "gnn_weights.pt"
NODE_INDEX_PATH = BASE_DIR / "models" / "node_index.json"


def _load_processed() -> List[dict]:
    if not PROCESSED_PATH.exists():
        raise HTTPException(status_code=404, detail="Processed data not found. Run /api/preprocess")
    return json.loads(PROCESSED_PATH.read_text())


@router.post("/train")
def train():
    data = _load_processed()
    graph_bundle = build_synergy_graph(data)
    pyg_data = graph_bundle["pyg_data"]
    node_index = graph_bundle["node_index"]

    team_indices = []
    targets = []
    for row in data:
        try:
            team_indices.append(
                [
                    node_index[row["surgeon_id"]],
                    node_index[row["anaesthetist_id"]],
                    node_index[row["scrub_nurse_id"]],
                ]
            )
            targets.append(row["duration_est_mins"])
        except KeyError:
            continue

    if not team_indices:
        raise HTTPException(status_code=400, detail="No valid training samples found.")

    team_tensor = torch.tensor(team_indices, dtype=torch.long)
    target_tensor = torch.tensor(targets, dtype=torch.float32)

    model = SurgicalSynergyGNN(input_dim=pyg_data.x.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    loss_fn = nn.MSELoss()

    loss_history = []
    model.train()
    for _ in range(100):
        optimizer.zero_grad()
        _, pred = model(pyg_data, team_tensor)
        loss = loss_fn(pred, target_tensor)
        loss.backward()
        optimizer.step()
        loss_history.append(float(loss.item()))

    torch.save(model.state_dict(), WEIGHTS_PATH)
    NODE_INDEX_PATH.write_text(json.dumps(node_index, indent=2))

    return {"status": "trained", "epochs": 100, "final_loss": loss_history[-1], "loss_history": loss_history}


@router.post("/predict")
def predict(payload: dict):
    data = _load_processed()
    graph_bundle = build_synergy_graph(data)
    pyg_data = graph_bundle["pyg_data"]
    node_index = graph_bundle["node_index"]
    g = graph_bundle["nx_graph"]

    if not WEIGHTS_PATH.exists():
        raise HTTPException(status_code=404, detail="Model weights not found. Run /api/train")

    model = SurgicalSynergyGNN(input_dim=pyg_data.x.shape[1])
    model.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
    model.eval()

    try:
        team_indices = torch.tensor(
            [
                [
                    node_index[payload["surgeon_id"]],
                    node_index[payload["anaesthetist_id"]],
                    node_index[payload["scrub_nurse_id"]],
                ]
            ],
            dtype=torch.long,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown staff ID: {exc}")

    with torch.no_grad():
        embeddings, duration = model(pyg_data, team_indices)

    pred = float(duration.squeeze().item())
    ci = [round(pred * 0.85, 1), round(pred * 1.15, 1)]

    edges = [
        g.get_edge_data(payload["surgeon_id"], payload["anaesthetist_id"]),
        g.get_edge_data(payload["surgeon_id"], payload["scrub_nurse_id"]),
        g.get_edge_data(payload["anaesthetist_id"], payload["scrub_nurse_id"]),
    ]
    synergy_weights = [edge["weight"] for edge in edges if edge]
    synergy_score = float(sum(synergy_weights) / max(len(synergy_weights), 1))

    risk_flag = (ci[1] - ci[0]) > 30 or synergy_score < 0.4

    embed_map = {
        payload["surgeon_id"]: embeddings[team_indices[0, 0]].tolist(),
        payload["anaesthetist_id"]: embeddings[team_indices[0, 1]].tolist(),
        payload["scrub_nurse_id"]: embeddings[team_indices[0, 2]].tolist(),
    }

    return {
        "predicted_duration_mins": round(pred, 1),
        "confidence_interval": ci,
        "team_synergy_score": round(synergy_score, 3),
        "node_embeddings": embed_map,
        "risk_flag": risk_flag,
    }
