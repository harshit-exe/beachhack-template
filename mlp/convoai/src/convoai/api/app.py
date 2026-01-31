from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from convoai.agent import chat_router
from convoai.api.routes import router

app = FastAPI(
    title="ConvoAI Extraction API",
    description="Extract preferences, decisions, intents, events & facts from queries using LangGraph + Groq",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Hello from ConvoAI!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

app.include_router(router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
