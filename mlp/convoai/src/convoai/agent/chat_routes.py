"""FastAPI routes for the chat agent."""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

chat_router = APIRouter()


@chat_router.get("/chat/ui", response_class=HTMLResponse)
async def chat_ui():
    return "<h1>Chat UI</h1>"
