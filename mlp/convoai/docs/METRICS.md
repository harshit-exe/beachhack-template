# ConvoAI Conversation Metrics

5 metric groups extracted from conversations. LLM outputs raw numerical scores, enums are derived rule-based.

---

## 1. Buying Signals

| Metric | Type | LLM Output | Rule-Based Enum | Rule |
|---|---|---|---|---|
| `intent` | Enum | `informational` / `commercial` / `transactional` | — | Direct from LLM |
| `purchase_strength_score` | Float | 0.0 – 1.0 | `purchase_strength` | < 0.4 → **weak**, 0.4–0.7 → **moderate**, > 0.7 → **strong** |
| `conversion_chance_score` | Float | 0.0 – 1.0 | `conversion_chance` | < 0.4 → **low**, 0.4–0.7 → **medium**, > 0.7 → **high** |
| — | Derived | — | `lead_status` | avg(purchase, conversion, urgency): < 0.35 → **cold**, 0.35–0.65 → **warm**, > 0.65 → **hot** |

---

## 2. Engagement & Trust

| Metric | Type | LLM Output | Rule-Based Enum | Rule |
|---|---|---|---|---|
| `tone` | Enum | `friendly` / `neutral` / `formal` / `frustrated` / `urgent` | — | Direct from LLM |
| `mood` | Enum | `positive` / `neutral` / `negative` | — | Direct from LLM |
| `trust_level_score` | Float | 0.0 – 1.0 | `trust_level` | < 0.3 → **low**, 0.3–0.6 → **medium**, 0.6–0.8 → **good**, > 0.8 → **high** |
| `response_latency_seconds` | Int | >= 0 | `response_speed` | <= 30s → **fast**, 31–90s → **normal**, > 90s → **slow** |

---

## 3. Timing & Readiness

| Metric | Type | LLM Output | Rule-Based Enum | Rule |
|---|---|---|---|---|
| `urgency_score` | Float | 0.0 – 1.0 | `urgency` | < 0.3 → **low**, 0.3–0.6 → **medium**, 0.6–0.85 → **high**, > 0.85 → **critical** |
| `decision_speed` | Enum | `slow` / `normal` / `fast` | — | Direct from LLM |
| `follow_up_required` | Bool | true / false | — | Direct from LLM |

---

## 4. Revenue Potential

| Metric | Type | LLM Output | Rule-Based Enum | Rule |
|---|---|---|---|---|
| `upsell_potential` | Int | 0 – 10 | — | Direct from LLM, clamped to 0–10 |
| `repeat_buy_score` | Float | 0.0 – 1.0 | `repeat_buy_potential` | < 0.4 → **low**, 0.4–0.7 → **medium**, > 0.7 → **high** |
| `price_sensitivity` | Enum | `low` / `medium` / `high` | — | Direct from LLM |
| `discount_dependency` | Enum | `low` / `medium` / `high` | — | Direct from LLM |

---

## 5. Experience Fit

| Metric | Type | LLM Output | Rule-Based Enum | Rule |
|---|---|---|---|---|
| `personalization_needed` | Enum | `low` / `medium` / `high` | — | Direct from LLM |

---

## Architecture

```
LLM (extract_node)          validate_node (rules)
─────────────────           ─────────────────────
raw scores + enums    →     apply threshold rules
                            derive enums from scores
                            derive lead_status from
                            avg(purchase, conversion, urgency)
```

**Graph flow:**
```
fetch_business_info → screen → (confidence >= threshold?) → extract → validate → END
                                         ↓ no
                                        END
```

## Rule Summary

| Score | 3-Level Enum | Thresholds |
|---|---|---|
| `purchase_strength_score` | weak / moderate / strong | 0.4, 0.7 |
| `conversion_chance_score` | low / medium / high | 0.4, 0.7 |
| `repeat_buy_score` | low / medium / high | 0.4, 0.7 |

| Score | 4-Level Enum | Thresholds |
|---|---|---|
| `trust_level_score` | low / medium / good / high | 0.3, 0.6, 0.8 |
| `urgency_score` | low / medium / high / critical | 0.3, 0.6, 0.85 |

| Value | Derived Enum | Thresholds |
|---|---|---|
| `response_latency_seconds` | fast / normal / slow | <= 30s, <= 90s, > 90s |
| avg(purchase, conversion, urgency) | cold / warm / hot | 0.35, 0.65 |
