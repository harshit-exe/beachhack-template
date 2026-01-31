"""LangGraph workflow that extracts conversation metrics using Groq + rule-based derivation."""

from __future__ import annotations

import json
from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph

from convoai.config import settings
from convoai.models import MetricsResult
from convoai.tools import get_business_info


class MetricsState(TypedDict):
    query: str
    user_id: str
    mobile_number: str
    messages: list[dict] | None
    business_info: dict | None
    confidence: float | None
    raw_scores: dict | None
    result: MetricsResult | None
    attempts: int
    eval_passed: bool | None
    eval_feedback: str | None
    error: str | None


# ── Screening prompt ────────────────────────────────────────────────

SCREENING_PROMPT = """\
You are a business query screening engine.

Business context:
{business_prompt}

Given the user query below, rate how relevant it is to the business described above.
Return ONLY a JSON object with a single key:
- "confidence": float (0.0 to 1.0)

0.0 = completely irrelevant, 1.0 = highly relevant.
Do NOT wrap the JSON in markdown code fences.
"""

# ── Extraction prompt (raw scores only) ─────────────────────────────

EXTRACTION_PROMPT = """\
You are a conversation metrics extraction engine. Extract ONLY raw numerical \
scores and categorical labels from the conversation.

Business context:
{business_prompt}

Analyse the user query (and optional messages) and return a JSON object with \
exactly these keys and value types. Do NOT derive enums — only output raw scores.

{{
  "buying_signals": {{
    "intent": "informational" | "commercial" | "transactional",
    "purchase_strength_score": float 0.0–1.0,
    "conversion_chance_score": float 0.0–1.0
  }},
  "engagement_trust": {{
    "tone": "friendly" | "neutral" | "formal" | "frustrated" | "urgent",
    "mood": "positive" | "neutral" | "negative",
    "trust_level_score": float 0.0–1.0,
    "response_latency_seconds": int >= 0
  }},
  "timing_readiness": {{
    "urgency_score": float 0.0–1.0,
    "decision_speed": "slow" | "normal" | "fast",
    "follow_up_required": bool
  }},
  "revenue_potential": {{
    "upsell_potential": int 0–10,
    "repeat_buy_score": float 0.0–1.0,
    "price_sensitivity": "low" | "medium" | "high",
    "discount_dependency": "low" | "medium" | "high"
  }},
  "experience_fit": {{
    "personalization_needed": "low" | "medium" | "high"
  }}
}}

Rules:
1. Return ONLY valid JSON. No markdown fences.
2. All float scores must be within 0.0–1.0.
3. upsell_potential must be 0–10.
4. If a metric cannot be determined, use 0 for numbers, false for bools, first enum value for enums.
5. Base scores on concrete language signals in the conversation.
{eval_feedback}
"""

# ── Evaluation prompt ───────────────────────────────────────────────

EVALUATION_PROMPT = """\
You are a metrics quality evaluator. Given a user query and the extracted metrics, \
determine if the metrics accurately reflect what the user said.

User query:
{query}

Extracted metrics (raw scores):
{raw_scores}

Check the following:
1. Does the intent type match what the user is actually saying?
2. Are the numerical scores reasonable for this query?
3. Does the tone/mood match the language used?
4. Is urgency correctly assessed?
5. Is follow_up_required correct?

Return ONLY a JSON object:
- "passed": bool (true if metrics are correct, false if they need re-extraction)
- "feedback": string (if passed=false, explain what is wrong so the extraction can be corrected)

Do NOT wrap the JSON in markdown code fences.
"""


# ── Rule-based enum derivation ──────────────────────────────────────

def _score_to_enum_3(score: float, thresholds: tuple[float, float], labels: tuple[str, str, str]) -> str:
    """Map a 0-1 score to a 3-level enum using two thresholds."""
    if score < thresholds[0]:
        return labels[0]
    if score < thresholds[1]:
        return labels[1]
    return labels[2]


def _score_to_enum_4(score: float, thresholds: tuple[float, float, float], labels: tuple[str, str, str, str]) -> str:
    """Map a 0-1 score to a 4-level enum using three thresholds."""
    if score < thresholds[0]:
        return labels[0]
    if score < thresholds[1]:
        return labels[1]
    if score < thresholds[2]:
        return labels[2]
    return labels[3]


def _latency_to_speed(seconds: int) -> str:
    if seconds <= 30:
        return "fast"
    if seconds <= 90:
        return "normal"
    return "slow"


def _derive_lead_status(purchase_score: float, conversion_score: float, urgency_score: float) -> str:
    avg = (purchase_score + conversion_score + urgency_score) / 3
    if avg >= 0.65:
        return "hot"
    if avg >= 0.35:
        return "warm"
    return "cold"


def apply_rules(raw: dict) -> MetricsResult:
    """Apply rule-based derivation to raw LLM scores → full MetricsResult."""
    bs = raw.get("buying_signals", {})
    et = raw.get("engagement_trust", {})
    tr = raw.get("timing_readiness", {})
    rp = raw.get("revenue_potential", {})
    ef = raw.get("experience_fit", {})

    purchase_score = float(bs.get("purchase_strength_score", 0))
    conversion_score = float(bs.get("conversion_chance_score", 0))
    trust_score = float(et.get("trust_level_score", 0))
    latency = int(et.get("response_latency_seconds", 0))
    urgency_score = float(tr.get("urgency_score", 0))
    repeat_score = float(rp.get("repeat_buy_score", 0))
    upsell = int(rp.get("upsell_potential", 0))

    return MetricsResult(
        buying_signals={
            "intent": bs.get("intent", "informational"),
            "purchase_strength": _score_to_enum_3(
                purchase_score, (0.4, 0.7), ("weak", "moderate", "strong")
            ),
            "purchase_strength_score": purchase_score,
            "lead_status": _derive_lead_status(purchase_score, conversion_score, urgency_score),
            "conversion_chance": _score_to_enum_3(
                conversion_score, (0.4, 0.7), ("low", "medium", "high")
            ),
            "conversion_chance_score": conversion_score,
        },
        engagement_trust={
            "tone": et.get("tone", "neutral"),
            "mood": et.get("mood", "neutral"),
            "trust_level": _score_to_enum_4(
                trust_score, (0.3, 0.6, 0.8), ("low", "medium", "good", "high")
            ),
            "trust_level_score": trust_score,
            "response_speed": _latency_to_speed(latency),
            "response_latency_seconds": latency,
        },
        timing_readiness={
            "urgency": _score_to_enum_4(
                urgency_score, (0.3, 0.6, 0.85), ("low", "medium", "high", "critical")
            ),
            "urgency_score": urgency_score,
            "decision_speed": tr.get("decision_speed", "normal"),
            "follow_up_required": bool(tr.get("follow_up_required", False)),
        },
        revenue_potential={
            "upsell_potential": max(0, min(10, upsell)),
            "repeat_buy_potential": _score_to_enum_3(
                repeat_score, (0.4, 0.7), ("low", "medium", "high")
            ),
            "repeat_buy_score": repeat_score,
            "price_sensitivity": rp.get("price_sensitivity", "medium"),
            "discount_dependency": rp.get("discount_dependency", "low"),
        },
        experience_fit={
            "personalization_needed": ef.get("personalization_needed", "low"),
        },
    )


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


def _get_business_prompt(state: MetricsState) -> str:
    info = state.get("business_info")
    if info and info.get("business_prompt"):
        return info["business_prompt"]
    return settings.business_prompt


def _build_conversation_messages(state: MetricsState) -> list:
    msgs = []
    if state.get("messages"):
        for msg in state["messages"]:
            if msg["role"] == "user":
                msgs.append(HumanMessage(content=msg["content"]))
            else:
                msgs.append(AIMessage(content=msg["content"]))
    return msgs


# ── Node functions ──────────────────────────────────────────────────

def fetch_business_info_node(state: MetricsState) -> dict:
    try:
        info = get_business_info.invoke({"business_id": "default"})
        return {"business_info": info, "error": None}
    except Exception as exc:
        return {"business_info": None, "error": f"Failed to fetch business info: {exc}"}


def screen_node(state: MetricsState) -> dict:
    llm = _get_llm()
    prompt = SCREENING_PROMPT.format(business_prompt=_get_business_prompt(state))
    messages = [SystemMessage(content=prompt)]
    messages.extend(_build_conversation_messages(state))
    messages.append(HumanMessage(content=state["query"]))
    response = llm.invoke(messages)

    try:
        parsed = _parse_json(response.content)
        confidence = float(parsed["confidence"])
        return {"confidence": max(0.0, min(1.0, confidence)), "error": None}
    except (json.JSONDecodeError, ValueError, KeyError) as exc:
        return {"confidence": None, "error": f"Failed to parse screening output: {exc}"}


def should_extract(state: MetricsState) -> str:
    confidence = state.get("confidence")
    if confidence is None:
        return "skip"
    if confidence >= settings.business_relevance_threshold:
        return "extract"
    return "skip"


def extract_node(state: MetricsState) -> dict:
    """Call Groq LLM to get raw numerical scores."""
    llm = _get_llm()

    # Include eval feedback if this is a retry
    eval_feedback = ""
    if state.get("eval_feedback"):
        eval_feedback = (
            f"\n6. IMPORTANT — Previous extraction was rejected. Fix this issue:\n"
            f"   {state['eval_feedback']}"
        )

    prompt = EXTRACTION_PROMPT.format(
        business_prompt=_get_business_prompt(state),
        eval_feedback=eval_feedback,
    )
    messages = [SystemMessage(content=prompt)]
    messages.extend(_build_conversation_messages(state))
    messages.append(HumanMessage(content=state["query"]))
    response = llm.invoke(messages)

    try:
        raw_scores = _parse_json(response.content)
        return {"raw_scores": raw_scores, "attempts": state.get("attempts", 0) + 1, "error": None}
    except (json.JSONDecodeError, ValueError) as exc:
        return {"raw_scores": None, "attempts": state.get("attempts", 0) + 1, "error": f"Failed to parse LLM output: {exc}"}


def validate_node(state: MetricsState) -> dict:
    """Apply rule-based derivation: raw scores → enums + final MetricsResult."""
    raw = state.get("raw_scores")
    if not raw:
        return state
    try:
        result = apply_rules(raw)
        return {"result": result, "error": None}
    except Exception as exc:
        return {"result": None, "error": f"Rule derivation failed: {exc}"}


def evaluate_node(state: MetricsState) -> dict:
    """LLM checks if the extracted metrics are correct for the query."""
    raw = state.get("raw_scores")
    if not raw:
        return {"eval_passed": False, "eval_feedback": "No raw scores to evaluate"}

    llm = _get_llm()
    prompt = EVALUATION_PROMPT.format(
        query=state["query"],
        raw_scores=json.dumps(raw, indent=2),
    )
    messages = [SystemMessage(content=prompt)]
    response = llm.invoke(messages)

    try:
        parsed = _parse_json(response.content)
        passed = bool(parsed.get("passed", False))
        feedback = parsed.get("feedback", "")
        return {"eval_passed": passed, "eval_feedback": feedback if not passed else None}
    except (json.JSONDecodeError, ValueError, KeyError):
        # If evaluation itself fails, pass it through to avoid infinite loop
        return {"eval_passed": True, "eval_feedback": None}


def should_retry(state: MetricsState) -> str:
    """Retry extraction if evaluation failed and attempts < 2."""
    if state.get("eval_passed", False):
        return "done"
    if state.get("attempts", 0) >= 2:
        return "done"
    return "retry"


# ── Graph construction ──────────────────────────────────────────────

def build_metrics_graph() -> StateGraph:
    graph = StateGraph(MetricsState)

    graph.add_node("fetch_business_info", fetch_business_info_node)
    graph.add_node("screen", screen_node)
    graph.add_node("extract", extract_node)
    graph.add_node("validate", validate_node)
    graph.add_node("evaluate", evaluate_node)

    graph.set_entry_point("fetch_business_info")
    graph.add_edge("fetch_business_info", "screen")
    graph.add_conditional_edges("screen", should_extract, {
        "extract": "extract",
        "skip": END,
    })
    graph.add_edge("extract", "validate")
    graph.add_edge("validate", "evaluate")
    graph.add_conditional_edges("evaluate", should_retry, {
        "retry": "extract",
        "done": END,
    })

    return graph.compile()


metrics_graph = build_metrics_graph()
