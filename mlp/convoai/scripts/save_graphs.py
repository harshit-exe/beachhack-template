"""Save LangGraph workflow diagrams as PNG images to docs/."""

from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent.parent / "docs"
DOCS_DIR.mkdir(exist_ok=True)

from convoai.agent.graph import chat_graph
from convoai.workflows.extraction import metrics_graph
from convoai.workflows.facts import facts_graph

# Chat agent graph
chat_png = chat_graph.get_graph().draw_mermaid_png()
(DOCS_DIR / "chat_graph.png").write_bytes(chat_png)
print(f"Saved: {DOCS_DIR / 'chat_graph.png'}")

# Metrics graph
metrics_png = metrics_graph.get_graph().draw_mermaid_png()
(DOCS_DIR / "metrics_graph.png").write_bytes(metrics_png)
print(f"Saved: {DOCS_DIR / 'metrics_graph.png'}")

# Facts graph
facts_png = facts_graph.get_graph().draw_mermaid_png()
(DOCS_DIR / "facts_graph.png").write_bytes(facts_png)
print(f"Saved: {DOCS_DIR / 'facts_graph.png'}")
