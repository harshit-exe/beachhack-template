"""Tools available to the LangGraph workflow via tool calling."""

from datetime import datetime, timezone

from langchain_core.tools import tool


@tool
def get_current_datetime() -> dict:
    """Get the current date and time in UTC ISO format.

    Returns:
        A dict with current_datetime as an ISO string.
    """
    now = datetime.now(timezone.utc)
    return {
        "current_datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
    }


@tool
def get_business_info(business_id: str = "default") -> dict:
    """Fetch business information and prompt configuration.

    Args:
        business_id: The business identifier to look up.

    Returns:
        A dict with business_prompt, business_name, and business_type.
    """
    # Static for now — swap this with a DB / API lookup later
    BUSINESS_REGISTRY: dict[str, dict] = {
        "default": {
            "business_name": "ConvoAI Demo Business",
            "business_type": "general",
            "business_prompt": (
                "You are an AI assistant for a business. "
                "The business handles customer inquiries, orders, appointments, "
                "support requests, and general product/service questions."
            ),
        },
    }

    info = BUSINESS_REGISTRY.get(business_id, BUSINESS_REGISTRY["default"])
    return info
