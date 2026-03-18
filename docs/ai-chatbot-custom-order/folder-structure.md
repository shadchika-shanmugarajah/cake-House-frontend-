# AI Chatbot + Custom Cake Ordering - Folder Structure

This is a ready-to-implement monorepo structure for your stack:
- Frontend: Next.js (or React app folder)
- Commerce backend: existing Node/Express API
- Chat backend: FastAPI (chatbot and AI orchestration only)
- Queue workers: async image validation and AI analysis

## Recommended Tree

```text
cake-house/
  apps/
    web/
      src/
        app/
        components/
          chatbot/
          order/
          notifications/
        modules/
          chatbot/
          products/
          cart/
          checkout/
          tracking/
          support/
        services/
          api-client.ts
          ws-client.ts
        store/
        utils/
      public/
      package.json

    commerce-api/
      src/
        config/
        middleware/
        models/
        routes/
          products.js
          orders.js
          customOrders.js
          payments.js
          notifications.js
        services/
          notificationService.js
          deliveryService.js
          orderLockService.js
        workers/
        validators/
      package.json

    chat-api-fastapi/
      app/
        main.py
        api/
          v1/
            chat.py
            custom_orders.py
            support.py
        core/
          config.py
          security.py
          logging.py
        models/
          chat_session.py
          chat_message.py
          custom_order_request.py
        schemas/
          chat.py
          custom_orders.py
          common.py
        services/
          gemini_service.py
          intent_router.py
          prompt_builder.py
          storage_service.py
          queue_service.py
        websocket/
          manager.py
        db/
          mongo.py
      requirements.txt

    workers/
      image-jobs/
        src/
          tasks/
            validate_image.py
            analyze_cake_image.py
          services/
            moderation_service.py
            gemini_vision_service.py
          app.py
        requirements.txt

  packages/
    shared-types/
      src/
        order.ts
        custom-order.ts
        chat.ts
        notification.ts

  infra/
    docker/
      docker-compose.yml
    redis/
    nginx/

  docs/
    ai-chatbot-custom-order/
      folder-structure.md
      mongo-schema-drafts.md
      endpoint-contracts.md
```

## Folder Notes

- `apps/web`: all UI flows (chatbot, normal order, custom order, tracking, notifications, human handoff).
- `apps/commerce-api`: source of truth for orders, pricing, payment, and tracking.
- `apps/chat-api-fastapi`: only chatbot communication, AI prompt/response, and custom-order orchestration.
- `apps/workers/image-jobs`: async queue workers for validation and AI image analysis.
- `packages/shared-types`: shared DTOs to keep frontend and APIs consistent.
- `infra`: local deployment and service wiring (MongoDB, Redis, ws routing).

## Minimum Environment Variables

### web
- `NEXT_PUBLIC_COMMERCE_API_URL`
- `NEXT_PUBLIC_CHAT_API_URL`
- `NEXT_PUBLIC_WS_URL`

### commerce-api
- `MONGODB_URI`
- `JWT_SECRET`
- `PAYMENT_PROVIDER_KEY`
- `CLOUD_STORAGE_BUCKET`
- `REDIS_URL`

### chat-api-fastapi
- `MONGODB_URI`
- `GEMINI_API_KEY`
- `REDIS_URL`
- `CLOUD_STORAGE_BUCKET`
- `CLOUD_STORAGE_REGION`

### workers
- `REDIS_URL`
- `MONGODB_URI`
- `GEMINI_API_KEY`
- `CLOUD_STORAGE_BUCKET`
