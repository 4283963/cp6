import csv
import os
from typing import List

from fastapi import FastAPI, HTTPException
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


class SoilSample(BaseModel):
    id: int
    x: float
    y: float
    ph: float


def read_csv() -> List[SoilSample]:
    if not os.path.exists(CSV_FILE):
        raise HTTPException(status_code=404, detail="CSV file not found")
    samples = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            samples.append(
                SoilSample(
                    id=int(row["id"]),
                    x=float(row["x"]),
                    y=float(row["y"]),
                    ph=float(row["ph"]),
                )
            )
    return samples


@app.get("/api/samples", response_model=List[SoilSample])
def get_samples():
    return read_csv()


@app.get("/api/samples/stats")
def get_stats():
    samples = read_csv()
    phs = [s.ph for s in samples]
    return {
        "count": len(samples),
        "ph_min": min(phs),
        "ph_max": max(phs),
        "ph_avg": round(sum(phs) / len(phs), 2),
    }
