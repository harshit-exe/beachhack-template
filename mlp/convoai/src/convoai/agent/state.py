"""Chat agent state definition."""

from langgraph.graph import MessagesState


class AgentState(MessagesState):
    messages : []
