"""Test the chat agent graph with logging."""

import logging

from langchain_core.messages import HumanMessage

from convoai.agent.graph import chat_graph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("groq").setLevel(logging.WARNING)

log = logging.getLogger("test_agent")


def run_test(query: str, thread_id: str):
    log.info("INPUT:  %s", query)

    for chunk in chat_graph.stream(
        {"messages": [HumanMessage(content=query)]},
        config={"configurable": {"thread_id": thread_id}},
    ):
        for node, output in chunk.items():
            if isinstance(output, dict) and "messages" in output:
                last = output["messages"][-1]
                content = last.content if hasattr(last, "content") else str(last)
                log.info("NODE:   %s", node)
                log.info("OUTPUT: %s", content)
                log.info("─" * 60)


def main():
    thread_id = "interactive-1"
    log.info("=" * 60)
    log.info("CHAT AGENT TEST (type 'quit' to exit)")
    log.info("=" * 60)

    while True:
        query = input("\n> ").strip()
        if not query:
            continue
        if query.lower() in ("quit", "exit", "q"):
            break
        run_test(query, thread_id)

    log.info("DONE")


if __name__ == "__main__":
    main()
