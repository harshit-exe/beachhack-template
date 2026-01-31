"""LangGraph chat agent graph."""

import sqlite3
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from .agent_llm import llm
from .state import AgentState

PREPROCESS_PROMPT = (
    "You are a text normalization agent. "
    "Clean and clarify the user's message without changing its intent, tone, or sentence type. "
    "Fix spelling and grammar, remove filler words, and lightly rephrase only when needed for clarity. "
    "Do NOT convert statements into questions or add new meaning. "
    "Return ONLY the cleaned message."
)

def preprocess_user_input(state: AgentState):
    """Extract the last user message, clean it via LLM, and append the clarified version."""
    messages = state["messages"]
    last_msg = messages[-1]

    response = llm.invoke([
        SystemMessage(content=PREPROCESS_PROMPT),
        HumanMessage(content=last_msg.content),
    ])

    return {"messages": [HumanMessage(content=response.content)]}


def user_session_identify(state: AgentState):
    return state


def intent_classification(state: AgentState):
    return state


def facts_extraction(state: AgentState):
    return state


def response_content(state: AgentState):
    return state


# ── graph builder ────────────────────────────────────────────


def build_chat_graph(checkpointer):
    graph = StateGraph(AgentState)

    graph.add_node("Pre-Process User Query", preprocess_user_input)
    graph.add_node("User Session Identify", user_session_identify)
    graph.add_node("Intent Classification", intent_classification)
    graph.add_node("Facts Extraction", facts_extraction)
    graph.add_node("Response Content", response_content)

    graph.add_edge(START, "Pre-Process User Query")

    # fan-out: preprocess → 3 parallel nodes
    graph.add_edge("Pre-Process User Query", "User Session Identify")
    graph.add_edge("Pre-Process User Query", "Intent Classification")
    graph.add_edge("Pre-Process User Query", "Facts Extraction")

    # fan-in: 3 parallel nodes → response
    graph.add_edge("User Session Identify", "Response Content")
    graph.add_edge("Intent Classification", "Response Content")
    graph.add_edge("Facts Extraction", "Response Content")

    graph.add_edge("Response Content", END)

    return graph.compile(checkpointer=checkpointer)


DB_PATH = Path(__file__).resolve().parents[3] / "agent.db"
_conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
checkpointer = SqliteSaver(_conn)
checkpointer.setup()
chat_graph = build_chat_graph(checkpointer)
