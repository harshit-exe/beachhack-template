"""LangGraph workflow that extracts personal facts from conversation queries using Groq."""

from __future__ import annotations

import json
from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph

from convoai.config import settings
from convoai.models import Fact
from convoai.tools import get_current_datetime


class FactsState(TypedDict):
    query: str
    user_id: str
    mobile_number: str
    source: str
    messages: list[dict] | None
    current_datetime: str | None
    facts: list[Fact]
    error: str | None


# ── Prompt ──────────────────────────────────────────────────────────

FACTS_PROMPT = """\
You are a fact extraction engine. Your job is to extract personal facts, \
preferences, important dates, habits, and any noteworthy information about \
the user from their conversation.

Current date and time: {current_datetime}

Extract each fact as a JSON object with these keys:
- "sentence": A clear, natural-language sentence stating the fact (e.g. "Harsh likes the color blue.")
- "category": One of: preference, important_date, relationship, habit, personal_info, \
  work, health, location, contact, financial, or any other fitting short label.

Return a JSON object with a single key:
- "facts": array of fact objects

Rules:
1. Return ONLY valid JSON. Do NOT wrap in markdown code fences.
2. Each fact should be a standalone sentence that makes sense on its own.
3. If a date or time is mentioned, resolve it relative to the current date/time provided above \
   and include the resolved date in the sentence (e.g. "next Monday" → "Monday, February 3, 2026").
4. Extract ALL facts — even small ones like color preferences, food likes, names of family members, etc.
5. If no facts can be extracted, return {{"facts": []}}.
6. Do NOT invent facts. Only extract what is explicitly stated or clearly implied.
"""


# ── Helpers ─────────────────────────────────────────────────────────

def _get_llm() -> ChatGroq:
    return ChatGroq(
        api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        temperature=0,
    )


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


# ── Node functions ──────────────────────────────────────────────────

def fetch_datetime_node(state: FactsState) -> dict:
    """Call get_current_datetime tool to get the current timestamp."""
    try:
        dt_info = get_current_datetime.invoke({})
        return {"current_datetime": dt_info["current_datetime"], "error": None}
    except Exception as exc:
        return {"current_datetime": None, "error": f"Failed to fetch datetime: {exc}"}


def extract_facts_node(state: FactsState) -> dict:
    """Call Groq LLM to extract facts from the conversation."""
    llm = _get_llm()

    current_dt = state.get("current_datetime") or "unknown"
    prompt = FACTS_PROMPT.format(current_datetime=current_dt)
    messages = [SystemMessage(content=prompt)]

    if state.get("messages"):
        for msg in state["messages"]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=state["query"]))
    response = llm.invoke(messages)

    try:
        parsed = _parse_json(response.content)
        raw_facts = parsed.get("facts", [])
        source = state.get("source", "chat")

        facts = [
            Fact(
                sentence=f["sentence"],
                category=f["category"],
                source=source,
            )
            for f in raw_facts
        ]
        return {"facts": facts, "error": None}
    except (json.JSONDecodeError, ValueError, KeyError) as exc:
        return {"facts": [], "error": f"Failed to parse facts output: {exc}"}


# ── Graph construction ──────────────────────────────────────────────

def build_facts_graph() -> StateGraph:
    graph = StateGraph(FactsState)

    graph.add_node("fetch_datetime", fetch_datetime_node)
    graph.add_node("extract_facts", extract_facts_node)

    graph.set_entry_point("fetch_datetime")
    graph.add_edge("fetch_datetime", "extract_facts")
    graph.add_edge("extract_facts", END)

    return graph.compile()


# Singleton compiled graph
facts_graph = build_facts_graph()
