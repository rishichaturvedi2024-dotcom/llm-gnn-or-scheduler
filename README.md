# OR Scheduler — GNN + LLM Research Demo

## Quick Start

### 1. Generate data
```bash
cd backend
python data/generate_synthetic.py
```

### 2. Start backend
```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
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
- Add your OpenAI API key to backend/.env for LLM features.
- Without a key, a mock normaliser and mock explainer are used.
- GNN training on 500 records takes ~30 seconds on CPU.
