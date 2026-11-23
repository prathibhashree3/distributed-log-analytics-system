
import os
import re
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from elasticsearch import Elasticsearch
from google import genai

load_dotenv()

app = FastAPI(title="AI Log Summarization Service")

# Frontend CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini configuration
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

GEMINI_MODEL = "gemini-3.5-flash-lite"

# Elasticsearch configuration
es = Elasticsearch(
    "https://localhost:9200",
    basic_auth=(
        os.getenv("ELASTICSEARCH_USERNAME", "elastic"),
        os.getenv("ELASTICSEARCH_PASSWORD", ""),
    ),
    verify_certs=False,
)

MICROSERVICE_NAMES = [
    "user-service",
    "order-service",
    "payment-service",
    "inventory-service",
]

TIMESTAMP_PATTERN = re.compile(
    r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
    r"(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))"
)

LEVEL_PATTERN = re.compile(
    r"\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|SEVERE)\b",
    re.IGNORECASE,
)

ERROR_LEVELS = {"ERROR", "FATAL", "SEVERE"}


class ManualErrorRequest(BaseModel):
    logs: str


# Health endpoints
@app.get("/")
def home():
    return {
        "status": "running",
        "service": "AI Log Summarization Service",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "gemini_configured": client is not None,
    }


@app.get("/elasticsearch-health")
def elasticsearch_health():
    try:
        info = es.info()
        return {
            "status": "connected",
            "cluster_name": info["cluster_name"],
            "version": info["version"]["number"],
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


# Extract and normalize logs
def extract_logs(result):
    logs = []

    for hit in result["hits"]["hits"]:
        source = hit.get("_source", {})
        message = str(source.get("message", ""))

        log_info = source.get("log", {})
        file_info = log_info.get("file", {})
        log_file = file_info.get("path", "")

        service_info = source.get("service", {})
        service_name = service_info.get("name", "")

        for name in MICROSERVICE_NAMES:
            if (
                name in str(log_file).lower()
                or f"[{name}]" in message.lower()
                or f"[{name.replace('-', '_')}]" in message.lower()
            ):
                service_name = name
                break

        if service_name not in MICROSERVICE_NAMES:
            continue

        level_match = LEVEL_PATTERN.search(message)

        level = (
            level_match.group(1).upper()
            if level_match
            else str(log_info.get("level", "UNKNOWN")).upper()
        )

        if level == "WARNING":
            level = "WARN"
        elif level == "SEVERE":
            level = "ERROR"

        timestamp_match = TIMESTAMP_PATTERN.search(message)

        timestamp = (
            timestamp_match.group(1)
            if timestamp_match
            else source.get("@timestamp", "")
        )

        logs.append({
            "timestamp": timestamp,
            "message": message[:1500],
            "service": service_name,
            "level": level,
            "log_file": log_file or None,
        })

    return logs


# Fetch logs from Elasticsearch
def fetch_microservice_logs(size=30):
    conditions = []

    for name in MICROSERVICE_NAMES:
        conditions.append({
            "wildcard": {
                "log.file.path": {
                    "value": f"*{name}.log",
                    "case_insensitive": True,
                }
            }
        })

    result = es.search(
        index="logs-*",
        size=500,
        query={
            "bool": {
                "should": conditions,
                "minimum_should_match": 1,
            }
        },
        sort=[
            {
                "@timestamp": {
                    "order": "desc",
                    "unmapped_type": "date",
                }
            }
        ],
    )

    logs = extract_logs(result)

    def timestamp_key(log):
        try:
            timestamp = log["timestamp"]

            if not timestamp:
                return 0

            value = datetime.fromisoformat(
                timestamp.replace("Z", "+00:00")
            )

            if value.tzinfo is None:
                value = value.astimezone()

            return value.timestamp()

        except (ValueError, TypeError, AttributeError):
            return 0

    logs.sort(key=timestamp_key, reverse=True)
    return logs[:size]


# Recent logs API
@app.get("/logs")
def get_logs(size: int = 20):
    if not 1 <= size <= 100:
        raise HTTPException(
            status_code=400,
            detail="Size must be between 1 and 100.",
        )

    try:
        logs = fetch_microservice_logs(size)

        return {
            "total_returned": len(logs),
            "services_found": sorted({
                log["service"] for log in logs
            }),
            "logs": logs,
        }

    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


# Shared Gemini analysis function
def analyze_error_text(error_text: str, task=None):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured.",
        )

    if not error_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide logs to analyze.",
        )

    prompt = f"""
You are an AI incident analyst for a microservices system.

Analyze the supplied logs and provide a short, clear report.

Use exactly this format:

Issue identified: One short sentence describing the problem.
Related services: Name only services supported by the logs.
Observed impact: Briefly describe the confirmed impact.
Possible explanation: Give a short explanation based on the evidence.
Recommended investigation: Suggest one or two practical next steps.

Rules:
- Use plain text only.
- Do not use Markdown headings, bullet points, numbered lists, or code fences.
- Keep each section to one short sentence.
- Avoid lengthy explanations.
- Do not invent events, services, impacts, or root causes.
- Distinguish confirmed facts from possible explanations.
- If evidence is insufficient, state that briefly.

Additional task:
{task or "Analyze the supplied error logs."}

LOGS:
{error_text[:20000]}
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        return {
            "analysis": response.text or "No analysis was returned.",
            "logs_analyzed": len(error_text.splitlines()),
        }

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI analysis failed: {str(e)}",
        )


# General AI summary API
@app.get("/summarize")
def summarize_logs(size: int = 30):
    if not 1 <= size <= 100:
        raise HTTPException(
            status_code=400,
            detail="Size must be between 1 and 100.",
        )

    try:
        logs = fetch_microservice_logs(size)

        if not logs:
            return {
                "summary": "No matching microservice logs were found.",
                "logs_analyzed": 0,
                "services_found": [],
                "logs": [],
            }

        analysis = analyze_error_text(
            "\n".join(
                f"[{log['service']}] [{log['level']}] "
                f"{log['timestamp']} - {log['message']}"
                for log in logs
            ),
            task=(
                "Summarize recent application events, errors, warnings, "
                "patterns, and recommended investigations."
            ),
        )

        return {
            "summary": analysis["analysis"],
            "logs_analyzed": len(logs),
            "services_found": sorted({
                log["service"] for log in logs
            }),
            "logs": logs,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


# Analyze manually pasted error logs
@app.post("/analyze-errors")
def analyze_manual_errors(request: ManualErrorRequest):
    return analyze_error_text(
        request.logs,
        task="Analyze the manually supplied error logs.",
    )


# Analyze error logs from Elasticsearch
@app.get("/analyze-error-logs")
def analyze_elasticsearch_errors(size: int = 100):
    if not 1 <= size <= 100:
        raise HTTPException(
            status_code=400,
            detail="Size must be between 1 and 100.",
        )

    try:
        logs = fetch_microservice_logs(size)

        error_logs = [
            log for log in logs
            if log["level"] in ERROR_LEVELS
        ]

        if not error_logs:
            return {
                "analysis": (
                    "No error-level logs were found in the retrieved logs."
                ),
                "logs_analyzed": 0,
                "services_found": [],
                "logs": [],
            }

        result = analyze_error_text(
            "\n".join(
                f"[{log['service']}] [{log['level']}] "
                f"{log['timestamp']} - {log['message']}"
                for log in error_logs
            ),
            task="Analyze these error logs and identify the likely issue.",
        )

        return {
            **result,
            "services_found": sorted({
                log["service"] for log in error_logs
            }),
            "logs": error_logs,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
