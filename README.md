# Operation Room Scheduler — GNN + LLM Research 

## Paper Summary (Why This Is Novel)
This project is a research demo for a conference paper on **LLM‑controlled adaptive graph learning** for Operating Room (OR) scheduling. Unlike standard pipelines where an LLM is only used to clean data, the LLM here is a **dynamic controller** that monitors GNN outputs and rewires the surgical synergy graph in real time.

### Core Idea
**LLM in-the-loop control** over a GNN‑based scheduling pipeline:
1. LLM normalizes messy EHR text into structured records.
2. A Surgical Synergy Graph models staff co‑assignment relationships.
3. A GraphSAGE GNN predicts procedure duration from team embeddings.
4. The LLM monitors uncertainty/risk and **reweights graph edges** to adapt inference.
5. A predict‑then‑optimize scheduler assigns OR rooms using the improved predictions.

## Why This Is Better Than Prior Work
- **Dynamic adaptation**: The LLM modifies the graph topology during inference instead of being a static pre/post‑processing tool.
- **Hybrid reasoning**: Combines symbolic LLM reasoning with relational GNN learning for clinically realistic edge cases.
- **Robust to missing data**: The controller explicitly handles sparse EHR data and rare team combinations.
- **Operational impact**: Predict‑then‑optimize scheduling reduces overtime compared to static baselines.

## Key Contributions (Conference Claims)
- *LLM‑guided adaptive graph learning* for OR scheduling.
- *Handling missing/uncertain medical data* via LLM feedback loops.
- *Hybrid symbolic + relational pipeline* that is interpretable and operationally useful.

## How the System Works (End‑to‑End)
1. **Data Generation**: Synthetic OR dataset (12,000 cases).
2. **LLM Pre‑processing**: Normalizes procedure names and cleans records.
3. **Graph Builder**: Builds a weighted surgical synergy graph (staff nodes, co‑assignment edges).
4. **GNN Training**: GraphSAGE learns team embeddings and predicts durations.
5. **LLM Controller**: Detects risk/uncertainty and reweights edges in real time.
6. **Scheduler**: Greedy interval scheduler assigns OR rooms within shift constraints.

## Quick Start

### 1. Generate data
```bash
cd backend
python data/generate_synthetic.py
```

### 2. Start backend
```bash
# Run from the root workspace directory
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000
```

### 3. Start frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open http://localhost:5173
Click "Run Full Pipeline" on the Dashboard.

## Notes
- Add your Groq API key to backend/.env for Llama features.
- Example:
	GROQ_API_KEY=your_key_here
	GROQ_MODEL=llama-3.1-70b-versatile
- Without a key, a mock normaliser and mock explainer are used.
- GNN training on 500 records takes ~30 seconds on CPU.

## Limitations and Ethics
- Medical privacy must be preserved; this demo uses synthetic data only.
- LLM outputs can hallucinate; controller actions should require clinician approval in production.
- Explainability is critical; audit logs for all LLM interventions are required.
