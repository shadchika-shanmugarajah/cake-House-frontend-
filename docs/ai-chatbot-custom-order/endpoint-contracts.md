# Custom Cake Ordering API Contracts

This file defines a complete ready-to-implement custom cake flow contract for:
- Chat API (FastAPI): `/chat-api/v1/*`
- Commerce API (Node): `/api/*`
- Real-time updates: WebSocket `/ws/notifications`

All protected endpoints require:
`Authorization: Bearer <jwt>`

## 1) Workflow (Text Diagram)
```text
Chat Open
  -> Custom Cake Order
  -> Upload Image
  -> Image Validation (queue)
  -> AI Analysis (Gemini queue)
  -> AI Description Ready
  -> User Edit/Confirm
  -> Submitted to Admin
  -> Admin Quote (price + notes)
  -> User Accept/Reject
     -> Reject -> Closed
     -> Accept -> Payment Enabled
  -> Payment Success or COD Confirm
  -> In Progress
  -> Packed
  -> Out for Delivery
  -> Delivered
  -> Rating Request
```

## 2) Status Model (Custom Requests)
Allowed `status` values for custom request:
- `ai_processing`
- `awaiting_user_confirmation`
- `awaiting_admin_quote`
- `quoted`
- `awaiting_user_acceptance`
- `awaiting_user_payment`
- `price_rejected`
- `price_accepted`
- `in_progress`
- `packed`
- `out_for_delivery`
- `delivered`
- `cancelled`

## 3) Chat API Contracts (FastAPI)
## 3.1 Start chat session
POST `/chat-api/v1/chat/session/start`

Request:
```json
{
  "channel": "web",
  "locale": "en",
  "context": {
    "entry_point": "floating_button"
  }
}
```

Response 200:
```json
{
  "session_id": "CHAT-AB12CD34EF",
  "status": "active",
  "welcome_message": "Welcome to Cake House. Choose an option to get started quickly: Browse Cakes, Track Order, Custom Cake Order, or Talk to Support.",
  "quick_replies": ["Browse Cakes", "Track Order", "Custom Cake Order", "Talk to Support"],
  "quick_actions": []
}
```

## 3.2 Send chat message
POST `/chat-api/v1/chat/message`

Request:
```json
{
  "session_id": "CHAT-AB12CD34EF",
  "message": "Custom Cake Order",
  "message_type": "text"
}
```

Response 200:
```json
{
  "reply": {
    "text": "Great. Let us start your custom cake order with image upload and design details.",
    "message_type": "text",
    "flow": "custom_order",
    "route_path": "/bulk-order",
    "products": [],
    "product_pagination": {
      "page": 1,
      "limit": 5,
      "total": 0,
      "total_pages": 0,
      "has_prev": false,
      "has_next": false,
      "category": "",
      "keyword": "",
      "min_price": null,
      "max_price": null
    },
    "quick_replies": ["Upload image", "Need human support"],
    "sample_messages": [],
    "action_cards": []
  },
  "intent": {
    "name": "custom_order",
    "confidence": 0.99
  },
  "fallback": false
}
```

## 3.3 Generate image upload URL
POST `/chat-api/v1/custom/upload-url`

Request:
```json
{
  "file_name": "reference-cake.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 1820441
}
```

Response 200:
```json
{
  "upload_url": "https://cdn.example.com/uploads/custom/xyz-reference-cake.jpg?signature=fake-signature&expires=900",
  "file_url": "https://cdn.example.com/uploads/custom/xyz-reference-cake.jpg",
  "expires_in": 900
}
```

## 3.4 Submit custom request
POST `/chat-api/v1/custom/submit`

Request:
```json
{
  "session_id": "CHAT-AB12CD34EF",
  "image_url": "https://cdn.example.com/uploads/custom/xyz-reference-cake.jpg",
  "customer_inputs": {
    "occasion": "Birthday",
    "servings": 25,
    "flavor": "Chocolate",
    "delivery_date": "2026-03-25",
    "delivery_slot": "14:00-16:00",
    "delivery_address_id": "67ab1ce3e7f1d6a67ca2a8f0",
    "notes": "Need blue flowers and a name topper"
  }
}
```

Response 202:
```json
{
  "request_id": "CUST-7F3D912A9B",
  "status": "ai_processing",
  "jobs": {
    "validationJobId": "job_val_101",
    "analysisJobId": "job_ai_102"
  },
  "message": "Custom request received. We are analyzing your image."
}
```

## 3.5 Get custom request status
GET `/chat-api/v1/custom/{request_id}/status`

Response 200:
```json
{
  "request_id": "CUST-7F3D912A9B",
  "status": "awaiting_user_confirmation",
  "ai_result": {
    "description": "2-tier chocolate cake with blue floral piping and gold accents.",
    "confidence": 0.88,
    "extracted_attributes": {
      "colors": ["Blue", "Gold"],
      "style": "Elegant",
      "tiers": 2,
      "text_on_cake": "",
      "decorations": ["Floral piping", "Gold accents"]
    },
    "status": "ready",
    "error_message": ""
  },
  "updated_at": "2026-03-18T09:55:00Z"
}
```

## 3.6 Confirm AI output (or edit)
POST `/chat-api/v1/custom/{request_id}/confirm`

Request:
```json
{
  "confirmed": true,
  "edited_description": "2-tier chocolate cake with blue flowers and topper text 'Happy Birthday Nethmi'"
}
```

Response 200:
```json
{
  "request_id": "CUST-7F3D912A9B",
  "status": "awaiting_admin_quote",
  "message": "Your custom cake request was sent to admin for pricing."
}
```

## 4) Commerce API Contracts (Node)
## 4.1 Admin set quote
PATCH `/api/custom-orders/{requestId}/quote`

Request:
```json
{
  "quotedPrice": 9800,
  "quoteNotes": "Includes custom topper and premium decorations"
}
```

Response 200:
```json
{
  "requestId": "CUST-7F3D912A9B",
  "status": "awaiting_user_acceptance",
  "adminQuote": {
    "quotedPrice": 9800,
    "quoteNotes": "Includes custom topper and premium decorations",
    "quotedAt": "2026-03-18T10:12:00Z"
  }
}
```

## 4.2 User accept quote
PATCH `/api/custom-orders/{requestId}/accept`

Request:
```json
{
  "decision": "accept",
  "paymentMethod": "online"
}
```

Response 200:
```json
{
  "requestId": "CUST-7F3D912A9B",
  "status": "awaiting_user_payment",
  "paymentEnabled": true,
  "amount": 9800,
  "currency": "LKR"
}
```

## 4.3 User reject quote
PATCH `/api/custom-orders/{requestId}/reject`

Request:
```json
{
  "decision": "reject",
  "reason": "Too expensive for my budget"
}
```

Response 200:
```json
{
  "requestId": "CUST-7F3D912A9B",
  "status": "price_rejected",
  "closed": true
}
```

## 4.4 Create payment intent
POST `/api/payments/intent`

Request:
```json
{
  "targetType": "custom_order",
  "targetId": "CUST-7F3D912A9B",
  "amount": 9800,
  "currency": "LKR",
  "method": "online"
}
```

Response 200:
```json
{
  "paymentId": "PAY-01J9J02",
  "provider": "stripe",
  "clientSecret": "pi_123_secret_abc",
  "status": "initiated"
}
```

## 4.5 Convert custom request to order after payment (or COD confirm)
POST `/api/custom-orders/{requestId}/create-order`

Request:
```json
{
  "paymentMethod": "online"
}
```

Response 201:
```json
{
  "orderId": "ORD-MMUXZTB4-5P3ONS",
  "status": "in_progress",
  "source": "custom"
}
```

## 4.6 Admin update order status
PATCH `/api/orders/{id}/status`

Request:
```json
{
  "status": "packed"
}
```

Response 200:
```json
{
  "orderId": "ORD-MMUXZTB4-5P3ONS",
  "status": "packed"
}
```

## 4.7 Tracking endpoint
GET `/api/orders/{id}/tracking`

Response 200:
```json
{
  "tracking": {
    "orderId": "ORD-MMUXZTB4-5P3ONS",
    "status": "out_for_delivery",
    "deliveryDate": "2026-03-25T00:00:00.000Z",
    "deliverySlot": "14:00-16:00",
    "paymentMethod": "online",
    "address": {
      "street": "25 Flower Road",
      "city": "Colombo"
    }
  },
  "progress": {
    "currentStatus": "out_for_delivery"
  }
}
```

## 5) Notification Contracts
## 5.1 Pull notifications
GET `/api/notifications?limit=50`

Response 200:
```json
{
  "notifications": [
    {
      "_id": "67b9...",
      "type": "custom_order_quote",
      "title": "Your Custom Quote Is Ready",
      "message": "Your custom cake request CUST-7F3D912A9B has been quoted.",
      "isRead": false,
      "relatedType": "custom_order",
      "relatedId": "CUST-7F3D912A9B",
      "redirectPath": "/notifications"
    }
  ],
  "unreadCount": 1
}
```

## 5.2 WebSocket events
Socket: `ws://<host>/ws/notifications`

Subscribe:
```json
{
  "type": "subscribe",
  "channels": ["user:<userId>", "admin:orders"]
}
```

Server event example:
```json
{
  "event": "custom_order.quoted",
  "timestamp": "2026-03-18T10:12:00Z",
  "userId": "67ab...",
  "data": {
    "requestId": "CUST-7F3D912A9B",
    "quotedPrice": 9800,
    "message": "Your custom quote is ready."
  }
}
```

Core custom-order events:
- `custom_order.received`
- `custom_order.ai_ready`
- `custom_order.confirmed`
- `custom_order.quoted`
- `custom_order.price_accepted`
- `custom_order.price_rejected`
- `custom_order.payment_received`
- `custom_order.in_progress`
- `order.status.updated`
- `order.delivered`
- `rating.requested`

## 6) Queue Payload Contracts
## 6.1 Image validation job payload
```json
{
  "jobType": "image_validation",
  "requestId": "CUST-7F3D912A9B",
  "imageUrl": "https://cdn.example.com/uploads/custom/xyz-reference-cake.jpg"
}
```

## 6.2 Image analysis job payload
```json
{
  "jobType": "image_analysis",
  "requestId": "CUST-7F3D912A9B",
  "imageUrl": "https://cdn.example.com/uploads/custom/xyz-reference-cake.jpg",
  "customerInputs": {
    "occasion": "Birthday",
    "servings": 25,
    "flavor": "Chocolate"
  }
}
```

## 7) Unified Error Contract
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Delivery date must be at least 2 days ahead.",
    "details": [
      {
        "field": "delivery_date",
        "message": "Must be >= 2026-03-20"
      }
    ],
    "requestId": "req_01J9K1X"
  }
}
```

Common codes:
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `IMAGE_VALIDATION_FAILED`
- `AI_UNAVAILABLE`
- `DELIVERY_NOT_FEASIBLE`
- `PAYMENT_REQUIRED`
