from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    business_prompt: str = (
        "You are an AI assistant for a business. "
        "The business handles customer inquiries, orders, appointments, "
        "support requests, and general product/service questions."
    )
    business_relevance_threshold: float = 0.5

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
