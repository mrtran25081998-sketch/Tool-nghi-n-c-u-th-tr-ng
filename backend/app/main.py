from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .worker import execute_crawl_job
from .classifier import classify_text

app = FastAPI(
    title="MB Competitive Intelligence Crawler Worker",
    description="Asynchronous crawler worker with SSRF protection, content extraction, deduplication, and classification.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CrawlRequest(BaseModel):
    job_id: str
    date_from: Optional[str] = "2024-01-01"
    date_to: Optional[str] = "2024-12-31"


class ClassifyRequest(BaseModel):
    text: str
    title: Optional[str] = ""


@app.get("/health")
async def health():
    return {"ok": True, "status": "healthy", "service": "mb-crawler-worker"}


@app.post("/internal/process-job")
async def process_job(payload: CrawlRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(execute_crawl_job, payload.job_id, payload.date_from, payload.date_to)
    return {"accepted": True, "job_id": payload.job_id, "status": "queued"}


@app.post("/internal/classify")
async def classify_content(payload: ClassifyRequest):
    result = classify_text(payload.text, payload.title)
    return {
        "relevant": result.relevant,
        "group_name": result.group_name,
        "component_name": result.component_name,
        "feature_name": result.feature_name,
        "summary": result.summary,
        "confidence": result.confidence,
    }
