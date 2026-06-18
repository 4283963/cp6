import csv
import math
import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Soil pH 3D Visualization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_FILE = os.path.join(os.path.dirname(__file__), "soil_samples.csv")
MAX_DEPTH = 100.0


class SoilSample(BaseModel):
    id: int
    x: float
    y: float
    ph: float
    depth: float


def read_csv_base():
    if not os.path.exists(CSV_FILE):
        raise HTTPException(status_code=404, detail="CSV file not found")
    samples = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            samples.append({
                "id": int(row["id"]),
                "x": float(row["x"]),
                "y": float(row["y"]),
                "ph_base": float(row["ph"]),
            })
    return samples


def adjust_ph_for_depth(ph_base: float, depth: float, x: float, y: float) -> float:
    depth_factor = (depth / MAX_DEPTH) * 1.8
    wave = math.sin(x * 0.08 + depth * 0.05) * 0.4 + math.cos(y * 0.07) * 0.3
    ph = ph_base - depth_factor + wave
    return round(max(3.0, min(10.0, ph)), 2)


@app.get("/api/samples", response_model=List[SoilSample])
def get_samples(depth: Optional[float] = Query(0.0, ge=0.0, le=100.0)):
    base = read_csv_base()
    result = []
    for s in base:
        result.append(SoilSample(
            id=s["id"],
            x=s["x"],
            y=s["y"],
            ph=adjust_ph_for_depth(s["ph_base"], depth or 0.0, s["x"], s["y"]),
            depth=depth or 0.0,
        ))
    return result


@app.get("/api/samples/stats")
def get_stats(depth: Optional[float] = Query(0.0, ge=0.0, le=100.0)):
    samples = get_samples(depth=depth)
    phs = [s.ph for s in samples]
    return {
        "count": len(samples),
        "depth": depth or 0.0,
        "ph_min": min(phs),
        "ph_max": max(phs),
        "ph_avg": round(sum(phs) / len(phs), 2),
    }
