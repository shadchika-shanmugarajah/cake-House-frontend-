# Image Jobs Worker

Processes async image validation and AI analysis jobs for custom cake requests.

## Quick Start

```bash
cd workers/image-jobs
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
```

Run workers in two terminals:

```bash
python -m src.app image_validation
python -m src.app image_analysis
```

## Expected queued functions

- `src.tasks.validate_image.validate_image_task`
- `src.tasks.analyze_cake_image.analyze_cake_image_task`

These jobs update `custom_order_requests` status and AI result fields.


# 1) Start Docker Desktop (wait until it is fully running)

# 2) Start Redis container
docker run -d --name cakehouse-redis -p 6379:6379 redis:7-alpine
# if already created:
# docker start cakehouse-redis

# 3) Verify Redis
docker exec cakehouse-redis redis-cli ping
# should print: PONG

# 4) Start worker with venv python
cd "D:\My Projects\cake-House-frontend-\workers\image-jobs"
.\.venv\Scripts\python.exe -m src.app image_analysis
