from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Tuple

import networkx as nx
import numpy as np
import torch
from torch_geometric.data import Data


ROLE_MAP = {"surgeon": 0, "anaesthetist": 1, "scrub_nurse": 2}


def _normalize(values: np.ndarray) -> np.ndarray:
    if values.size == 0:
        return values
    vmin = values.min()
    vmax = values.max()
    if vmax - vmin < 1e-6:
        return np.zeros_like(values)
    return (values - vmin) / (vmax - vmin)


def build_synergy_graph(processed_data: List[dict]) -> Dict:
    g = nx.Graph()

    staff_stats = defaultdict(lambda: {"num_cases": 0, "outcome": [], "complexity": [], "duration": []})

    for row in processed_data:
        surgeon_id = row["surgeon_id"]
        anaesthetist_id = row["anaesthetist_id"]
        scrub_nurse_id = row["scrub_nurse_id"]
        
        for staff_id, role in [
            (surgeon_id, "surgeon"),
            (anaesthetist_id, "anaesthetist"),
            (scrub_nurse_id, "scrub_nurse"),
        ]:
            if not g.has_node(staff_id):
                g.add_node(staff_id, role=role)
            stats = staff_stats[staff_id]
            stats["num_cases"] += 1
            stats["outcome"].append(row["outcome_score"])
            stats["complexity"].append(row["complexity"])
            stats["duration"].append(row["duration_est_mins"])

        team = [surgeon_id, anaesthetist_id, scrub_nurse_id]
        for i in range(len(team)):
            for j in range(i + 1, len(team)):
                a, b = team[i], team[j]
                if g.has_edge(a, b):
                    g[a][b]["co_occurrence"] += 1
                    g[a][b]["outcomes"].append(row["outcome_score"])
                else:
                    g.add_edge(a, b, co_occurrence=1, outcomes=[row["outcome_score"]])

    for node_id, stats in staff_stats.items():
        g.nodes[node_id]["num_cases"] = stats["num_cases"]
        g.nodes[node_id]["avg_outcome"] = float(np.mean(stats["outcome"]))
        g.nodes[node_id]["avg_complexity"] = float(np.mean(stats["complexity"]))
        g.nodes[node_id]["avg_duration"] = float(np.mean(stats["duration"]))

    for a, b, data in g.edges(data=True):
        avg_outcome = float(np.mean(data["outcomes"]))
        data["avg_outcome"] = avg_outcome
        data["weight"] = (data["co_occurrence"] * avg_outcome) / 10.0

    nodes = list(g.nodes())
    node_index = {node_id: idx for idx, node_id in enumerate(nodes)}
    index_node = {idx: node_id for node_id, idx in node_index.items()}

    num_cases = _normalize(np.array([g.nodes[n]["num_cases"] for n in nodes], dtype=np.float32))
    avg_outcome = _normalize(np.array([g.nodes[n]["avg_outcome"] for n in nodes], dtype=np.float32))
    avg_complexity = _normalize(np.array([g.nodes[n]["avg_complexity"] for n in nodes], dtype=np.float32))
    avg_duration = _normalize(np.array([g.nodes[n]["avg_duration"] for n in nodes], dtype=np.float32))
    role_encoded = np.array([ROLE_MAP[g.nodes[n]["role"]] for n in nodes], dtype=np.float32)

    x = np.stack([num_cases, avg_outcome, avg_complexity, avg_duration, role_encoded], axis=1)

    edges = []
    weights = []
    for a, b, data in g.edges(data=True):
        edges.append([node_index[a], node_index[b]])
        edges.append([node_index[b], node_index[a]])
        weights.append(data["weight"])
        weights.append(data["weight"])

    edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous() if edges else torch.empty((2, 0), dtype=torch.long)
    edge_weight = torch.tensor(weights, dtype=torch.float32) if weights else torch.empty((0,), dtype=torch.float32)

    pyg_data = Data(x=torch.tensor(x, dtype=torch.float32), edge_index=edge_index, edge_weight=edge_weight)

    degrees = [d for _, d in g.degree()]
    stats = {
        "num_nodes": g.number_of_nodes(),
        "num_edges": g.number_of_edges(),
        "avg_degree": float(np.mean(degrees) if degrees else 0.0),
        "density": float(nx.density(g) if g.number_of_nodes() > 1 else 0.0),
    }

    return {
        "nx_graph": g,
        "pyg_data": pyg_data,
        "node_index": node_index,
        "index_node": index_node,
        "stats": stats,
    }
