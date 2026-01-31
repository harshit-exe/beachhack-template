Below is a detailed, field-by-field breakdown for each numeric value, with:

✅ Range (ratio)

✅ Derived enum labels

✅ Meaning in business terms

✅ Why the thresholds make sense

You can treat this as a spec / contract for dashboards, rules, ML, and audits.

🔢 Numerical Scores → Enums (Detailed Spec)

Rule of thumb:
All scores are normalized to 0.0 – 1.0 (except upsell_score: 0–10)

1️⃣ intent_score

What it measures: Strength of buying intent (not type)

Range → Enum
Score Range	Enum
>= 0.80	commercial
0.40 – 0.79	informational
< 0.40	passive / support
Your value

0.86 → commercial

Meaning: User is clearly expressing purchase-oriented intent.

2️⃣ purchase_strength_score

What it measures: How strongly the user wants to buy

Range → Enum
Score Range	Enum
>= 0.80	strong
0.50 – 0.79	moderate
< 0.50	weak
Your value

0.85 → strong

Meaning: Language + behavior indicate firm buying motivation.

3️⃣ conversion_probability

What it measures: Likelihood of conversion if engaged

Range → Enum
Score Range	Enum
>= 0.75	high
0.40 – 0.74	medium
< 0.40	low
Your value

0.78 → high

Meaning: This lead is statistically likely to convert.

4️⃣ trust_score

What it measures: Confidence in brand / seller

Range → Enum
Score Range	Enum
>= 0.75	high
0.50 – 0.74	good
< 0.50	low
Your value

0.70 → good

Meaning: Trust is present but not absolute.

5️⃣ response_speed_score

What it measures: How quickly the user responds

Range → Enum
Score Range	Enum
>= 0.80	fast
0.50 – 0.79	normal
< 0.50	slow
Your value

0.90 → fast

Meaning: User is actively engaged right now.

6️⃣ urgency_score

What it measures: Time pressure in the user’s intent

Range → Enum
Score Range	Enum
>= 0.80	high
0.50 – 0.79	medium
< 0.50	low
Your value

0.82 → high

Meaning: Decision window is short.

7️⃣ decision_speed_score

What it measures: How fast the user is moving toward a decision

Range → Enum
Score Range	Enum
>= 0.80	fast
0.50 – 0.79	normal
< 0.50	slow
Your value

0.88 → fast

Meaning: Fewer internal delays or approvals.

8️⃣ upsell_score (0–10)

What it measures: Upsell / cross-sell potential

Range → Enum
Score Range	Enum
8 – 10	very high
5 – 7	medium
0 – 4	low
Your value

7 → medium

Meaning: Solid potential for add-ons or higher value.

9️⃣ repeat_buy_score

What it measures: Likelihood of future purchases

Range → Enum
Score Range	Enum
>= 0.70	high
0.40 – 0.69	medium
< 0.40	low
Your value

0.74 → high

Meaning: Customer likely to return.

🔟 price_sensitivity_score

What it measures: How sensitive the user is to price

⚠️ Higher score = more sensitive

Range → Enum
Score Range	Enum
>= 0.70	high
0.40 – 0.69	medium
< 0.40	low
Your value

0.50 → medium

Meaning: Price matters, but not the only factor.

1️⃣1️⃣ discount_dependency_score

What it measures: Reliance on discounts to convert

Range → Enum
Score Range	Enum
>= 0.70	high
0.40 – 0.69	medium
< 0.40	low
Your value

0.20 → low

Meaning: Conversion does not depend on discounts.

1️⃣2️⃣ personalization_score

What it measures: Need for tailored experience

Range → Enum
Score Range	Enum
>= 0.70	high
0.40 – 0.69	medium
< 0.40	low
Your value

0.55 → medium

Meaning: Some customization improves conversion.

1️⃣3️⃣ sentiment_score

What it measures: Emotional tone of the user

Range → Enum
Score Range	Enum
>= 0.50	positive
-0.49 – 0.49	neutral
< -0.50	negative
Your value

0.62 → positive

Meaning: User feels good about the interaction.

🧠 Final Derived Snapshot (Auto-generated)
Intent: Commercial
Lead Status: Hot
Purchase Strength: Strong
Urgency: High
Trust: Good
Decision Speed: Fast
Upsell Potential: Medium
Repeat Buy: High
Discount Dependency: Low
Sentiment: Positive

🔑 Key Design Principle (lock this in)

Numbers are truth.
Enums are just views.
Thresholds are configurable.

This makes your system:

explainable

tunable

dashboard-friendly

ML-ready