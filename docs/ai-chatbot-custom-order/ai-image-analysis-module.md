# AI Cake Image Analysis Module (Gemini)

## Gemini Integration Flow

1. User uploads cake reference image via `POST /chat-api/v1/custom/upload`.
2. Image is validated (type, quality, non-cake detection) and saved to local/cloud storage.
3. User submits custom request via `POST /chat-api/v1/custom/submit`.
4. Chat API enqueues `image_analysis` queue job with:
   - `requestId`
   - `imageUrl`
   - `customerInputs`
5. Worker `analyze_cake_image_task` downloads image and sends prompt + image bytes to Gemini.
6. Worker parses JSON response into structured fields.
7. Worker stores both:
   - Structured `aiResult`
   - Raw model output `aiResult.rawResponse`
8. On AI failure, worker retries automatically.
9. If retries fail, request moves to manual review (`awaiting_admin_quote`).
10. User can trigger manual retry via `POST /chat-api/v1/custom/{request_id}/retry-analysis`.

## FastAPI + Worker Modules

- Upload + validation API:
  - `chat-api-fastapi/app/api/v1/custom_orders.py`
  - `chat-api-fastapi/app/services/image_validation_service.py`
  - `chat-api-fastapi/app/services/storage_service.py`
- Custom request + queue dispatch:
  - `chat-api-fastapi/app/services/custom_order_service.py`
- AI worker execution:
  - `workers/image-jobs/src/tasks/analyze_cake_image.py`
- Gemini analysis service:
  - `workers/image-jobs/src/services/gemini_vision_service.py`

## Example Gemini Prompt

```text
You are a cake designer AI. Analyze the provided cake reference image and return ONLY valid JSON.
Do not add markdown or extra text.
If uncertain, keep values empty and reduce confidence.
JSON schema:
{"description":"string","cakeType":"string","flavor":"string","shape":"string","designStyle":"string","colors":["string"],"textOnCake":"string","layerCount":null,"decorationElements":["string"],"confidence":0.0,"analysisStatus":"ready|needs_human_review"}.
Customer hints: occasion=Birthday, flavor_hint=Chocolate, notes=Need red roses and happy birthday text.
```

## Structured Output Format

```json
{
  "description": "This is a 2-layer chocolate cake with white cream frosting, decorated with red roses and a Happy Birthday message.",
  "cakeType": "Birthday Cake",
  "flavor": "Chocolate",
  "shape": "Round",
  "designStyle": "Floral",
  "colors": ["White", "Red"],
  "textOnCake": "Happy Birthday",
  "layerCount": 2,
  "decorationElements": ["Red roses", "Cream piping"],
  "confidence": 0.9,
  "status": "ready",
  "errorMessage": "",
  "rawResponse": "...raw Gemini text..."
}
```

## Error Handling Strategy

1. Validation failure before AI:
   - Block unsupported files, oversized files, low quality, non-cake images.
2. Gemini response parse failure:
   - Mark temporary `retryable` and retry automatically.
3. Gemini API/network failure:
   - Retry up to configured attempts (`AI_ANALYSIS_MAX_RETRIES + 1`).
4. Exhausted retries:
   - Convert to `needs_human_review`
   - Move request to `awaiting_admin_quote`
   - Preserve `errorMessage` and `rawResponse` for debugging.
5. Manual retry path:
   - `POST /chat-api/v1/custom/{request_id}/retry-analysis`
   - Re-queues image analysis and resets AI status to `pending`.
