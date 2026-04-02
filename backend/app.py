from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import preprocess, graph, gnn, schedule, explain

app = FastAPI(title="OR Scheduler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(preprocess.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(gnn.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(explain.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "OR Scheduler API running"}
