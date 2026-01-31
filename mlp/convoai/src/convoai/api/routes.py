from fastapi import APIRouter, HTTPException
from convoai.models import MetricsRequest, MetricsResponse, FactsRequest, FactsResponse
from convoai.workflows.extraction import metrics_graph
from convoai.workflows.facts import facts_graph

router = APIRouter(tags=["extraction"])


@router.post("/extract/metrics", response_model=MetricsResponse)
async def extract_metrics(request: MetricsRequest):
    """Extract conversation metrics with rule-based enum derivation."""
    try:
        state = {
            "query": request.query,
            "user_id": request.user_id,
            "mobile_number": request.mobile_number,
            "messages": [m.model_dump() for m in request.messages] if request.messages else None,
            "business_info": None,
            "confidence": None,
            "raw_scores": None,
            "result": None,
            "attempts": 0,
            "eval_passed": None,
            "eval_feedback": None,
            "error": None,
        }

        final_state = await metrics_graph.ainvoke(state)

        confidence = final_state.get("confidence")

        if final_state.get("error"):
            return MetricsResponse(success=False, confidence=confidence, error=final_state["error"])

        return MetricsResponse(
            success=True,
            confidence=confidence,
            data=final_state.get("result"),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract/facts", response_model=FactsResponse)
async def extract_facts(request: FactsRequest):
    """Extract personal facts from a user conversation."""
    try:
        state = {
            "query": request.query,
            "user_id": request.user_id,
            "mobile_number": request.mobile_number,
            "source": request.source,
            "messages": [m.model_dump() for m in request.messages] if request.messages else None,
            "current_datetime": None,
            "facts": [],
            "error": None,
        }

        final_state = await facts_graph.ainvoke(state)

        if final_state.get("error"):
            return FactsResponse(success=False, error=final_state["error"])

        return FactsResponse(
            success=True,
            facts=final_state.get("facts", []),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health")
async def health():
    return {"status": "ok"}
