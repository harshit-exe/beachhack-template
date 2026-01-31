from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


# ── 1. Buying Signals ──────────────────────────────────────────────

class BuyingSignals(BaseModel):
    intent: Literal["informational", "commercial", "transactional"] = Field(
        default="informational"
    )
    purchase_strength: Literal["weak", "moderate", "strong"] = Field(default="weak")
    purchase_strength_score: float = Field(default=0.0, ge=0, le=1)
    lead_status: Literal["cold", "warm", "hot"] = Field(default="cold")
    conversion_chance: Literal["low", "medium", "high"] = Field(default="low")
    conversion_chance_score: float = Field(default=0.0, ge=0, le=1)


# ── 2. Engagement & Trust ──────────────────────────────────────────

class EngagementTrust(BaseModel):
    tone: Literal["friendly", "neutral", "formal", "frustrated", "urgent"] = Field(
        default="neutral"
    )
    mood: Literal["positive", "neutral", "negative"] = Field(default="neutral")
    trust_level: Literal["low", "medium", "good", "high"] = Field(default="medium")
    trust_level_score: float = Field(default=0.0, ge=0, le=1)
    response_speed: Literal["slow", "normal", "fast"] = Field(default="normal")
    response_latency_seconds: int = Field(default=0, ge=0)


# ── 3. Timing & Readiness ──────────────────────────────────────────

class TimingReadiness(BaseModel):
    urgency: Literal["low", "medium", "high", "critical"] = Field(default="low")
    urgency_score: float = Field(default=0.0, ge=0, le=1)
    decision_speed: Literal["slow", "normal", "fast"] = Field(default="normal")
    follow_up_required: bool = Field(default=False)


# ── 4. Revenue Potential ───────────────────────────────────────────

class RevenuePotential(BaseModel):
    upsell_potential: int = Field(default=0, ge=0, le=10)
    repeat_buy_potential: Literal["low", "medium", "high"] = Field(default="low")
    repeat_buy_score: float = Field(default=0.0, ge=0, le=1)
    price_sensitivity: Literal["low", "medium", "high"] = Field(default="medium")
    discount_dependency: Literal["low", "medium", "high"] = Field(default="low")


# ── 5. Experience Fit ──────────────────────────────────────────────

class ExperienceFit(BaseModel):
    personalization_needed: Literal["low", "medium", "high"] = Field(default="low")


# ── Top-level metrics result ───────────────────────────────────────

class MetricsResult(BaseModel):
    buying_signals: BuyingSignals = Field(default_factory=BuyingSignals)
    engagement_trust: EngagementTrust = Field(default_factory=EngagementTrust)
    timing_readiness: TimingReadiness = Field(default_factory=TimingReadiness)
    revenue_potential: RevenuePotential = Field(default_factory=RevenuePotential)
    experience_fit: ExperienceFit = Field(default_factory=ExperienceFit)


# ── Shared models ──────────────────────────────────────────────────

class Message(BaseModel):
    role: str = Field(description="Message role, e.g. 'user' or 'assistant'")
    content: str = Field(description="Message content")


# ── Fact models ────────────────────────────────────────────────────

class Fact(BaseModel):
    sentence: str = Field(description="The extracted fact as a natural-language sentence")
    category: str = Field(description="Fact category, e.g. preference, important_date, relationship, habit, personal_info")
    source: str = Field(default="chat", description="Source channel: chat, call, email, etc.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FactsRequest(BaseModel):
    query: str = Field(description="The user query / conversation text to extract facts from")
    user_id: str = Field(description="Unique identifier for the user")
    mobile_number: str = Field(description="User's mobile number")
    source: str = Field(default="chat", description="Source channel: chat, call, email, etc.")
    messages: list[Message] | None = Field(default=None)


class FactsResponse(BaseModel):
    success: bool
    facts: list[Fact] = Field(default_factory=list)
    error: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Metrics API models ─────────────────────────────────────────────

class MetricsRequest(BaseModel):
    query: str = Field(description="The user query / conversation text to analyse")
    user_id: str = Field(description="Unique identifier for the user")
    mobile_number: str = Field(description="User's mobile number")
    messages: list[Message] | None = Field(default=None)


class MetricsResponse(BaseModel):
    success: bool
    confidence: float | None = Field(default=None, ge=0, le=1)
    data: MetricsResult | None = None
    error: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
