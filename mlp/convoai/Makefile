redis:
	docker compose up -d redis

run: 
	poetry run uvicorn src.convoai.api.app:app --reload

agent: 
	poetry run python -m tests.test_agent

graph:
	poetry run python scripts/save_graphs.py