"""System prompts for the chat agent."""

ROUTER_SYSTEM_PROMPT = ""

SUPPORT_SYSTEM_PROMPT = ""

SALES_SYSTEM_PROMPT = ""

AGENT_PROMPTS: dict[str, str] = {
    "support": SUPPORT_SYSTEM_PROMPT,
    "sales": SALES_SYSTEM_PROMPT,
}
