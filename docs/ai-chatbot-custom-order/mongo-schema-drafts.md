# Mongo Schema Drafts

These drafts are compatible with MongoDB + Mongoose style modeling.

## 1) users

```js
{
  _id: ObjectId,
  name: String,
  email: String, // unique, lowercase
  phone: String,
  role: String, // user | admin | support
  addresses: [{
    _id: ObjectId,
    label: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ email: 1 } unique`
- `{ role: 1 }`

## 2) products

```js
{
  _id: ObjectId,
  productName: String,
  categoryId: ObjectId,
  price: Number,
  description: String,
  image: String,
  images: [String],
  stockQuantity: Number,
  lowStockThreshold: Number,
  averageRating: Number,
  reviewCount: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ categoryId: 1, isActive: 1 }`
- `{ productName: "text", description: "text" }`

## 3) chat_sessions

```js
{
  _id: ObjectId,
  sessionId: String, // unique public ID
  userId: ObjectId,
  status: String, // active | closed | handed_off
  channel: String, // web
  context: {
    currentIntent: String,
    cartDraft: [{ productId: ObjectId, quantity: Number }],
    lastProductId: ObjectId,
    customOrderRequestId: ObjectId
  },
  fallbackCount: Number,
  handedOffToSupport: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ sessionId: 1 } unique`
- `{ userId: 1, createdAt: -1 }`

## 4) chat_messages

```js
{
  _id: ObjectId,
  sessionId: String,
  sender: String, // user | bot | support
  messageType: String, // text | quick_reply | product_card | system
  text: String,
  payload: Object,
  intent: String,
  confidence: Number,
  createdAt: Date
}
```
Indexes:
- `{ sessionId: 1, createdAt: 1 }`

## 5) custom_order_requests

```js
{
  _id: ObjectId,
  requestId: String, // unique public ID
  userId: ObjectId,
  sessionId: String,
  imageUrl: String,
  imageMeta: {
    mimeType: String,
    sizeBytes: Number,
    width: Number,
    height: Number,
    checksum: String
  },
  customerInputs: {
    occasion: String,
    servings: Number,
    flavor: String,
    deliveryDate: Date,
    deliverySlot: String,
    deliveryAddressId: ObjectId,
    notes: String
  },
  aiResult: {
    description: String,
    extractedAttributes: {
      colors: [String],
      style: String,
      tiers: Number,
      textOnCake: String,
      decorations: [String]
    },
    confidence: Number,
    status: String, // pending | ready | failed | needs_human_review
    errorMessage: String
  },
  userConfirmation: {
    confirmed: Boolean,
    editedDescription: String,
    confirmedAt: Date
  },
  adminQuote: {
    quotedPrice: Number,
    quoteNotes: String,
    quotedBy: ObjectId,
    quotedAt: Date
  },
  status: String, // draft | submitted | ai_processing | awaiting_user_confirmation | awaiting_admin_quote | awaiting_user_payment | approved | rejected | converted_to_order | cancelled
  lock: {
    isLocked: Boolean,
    lockReason: String,
    lockedBy: String,
    lockedAt: Date,
    expiresAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ requestId: 1 } unique`
- `{ userId: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`

## 6) orders

```js
{
  _id: ObjectId,
  orderId: String, // unique public ID
  userId: ObjectId,
  source: String, // web | chatbot | custom
  customOrderRequestId: ObjectId,
  items: [{
    _id: ObjectId,
    productId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  pricing: {
    subtotal: Number,
    tax: Number,
    shipping: Number,
    discount: Number,
    totalAmount: Number
  },
  payment: {
    method: String, // online | cash_on_delivery
    status: String, // pending | paid | failed | refunded
    transactionId: String
  },
  delivery: {
    addressSnapshot: Object,
    deliveryDate: Date,
    deliverySlot: String,
    feasibilityChecked: Boolean
  },
  orderStatus: String, // pending | packed | out_for_delivery | delivered | cancelled
  cancellation: {
    allowed: Boolean,
    cancelledAt: Date,
    cancelledBy: String,
    reason: String
  },
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ orderId: 1 } unique`
- `{ userId: 1, createdAt: -1 }`
- `{ orderStatus: 1 }`

## 7) payments

```js
{
  _id: ObjectId,
  paymentId: String, // unique public ID
  userId: ObjectId,
  orderId: ObjectId,
  customOrderRequestId: ObjectId,
  provider: String, // stripe | payhere | razorpay
  amount: Number,
  currency: String,
  method: String,
  providerIntentId: String,
  providerPayload: Object,
  status: String, // initiated | pending | succeeded | failed | refunded
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ paymentId: 1 } unique`
- `{ orderId: 1 }`
- `{ providerIntentId: 1 }`

## 8) notifications

```js
{
  _id: ObjectId,
  userId: ObjectId,
  roleTarget: String, // user | admin
  type: String, // order_placed | order_status | custom_quote | custom_approved | custom_rejected | payment_success | rating_request | support_assigned
  title: String,
  message: String,
  data: {
    orderId: String,
    customOrderRequestId: String,
    redirectTo: String
  },
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ userId: 1, isRead: 1, createdAt: -1 }`
- `{ roleTarget: 1, createdAt: -1 }`

## 9) support_tickets

```js
{
  _id: ObjectId,
  ticketId: String, // unique
  userId: ObjectId,
  sessionId: String,
  customOrderRequestId: ObjectId,
  reason: String,
  status: String, // open | assigned | resolved | closed
  assignedTo: ObjectId,
  priority: String, // low | medium | high
  messages: [{
    sender: String, // user | support
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ ticketId: 1 } unique`
- `{ status: 1, createdAt: -1 }`

## 10) order_locks

```js
{
  _id: ObjectId,
  resourceType: String, // order | custom_order_request
  resourceId: String,
  lockKey: String, // unique
  lockedBy: String, // system | admin:{id} | user:{id}
  reason: String,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ lockKey: 1 } unique`
- `{ resourceType: 1, resourceId: 1 }`
- TTL on `{ expiresAt: 1 }`

## 11) queue_jobs (optional app-level audit)

```js
{
  _id: ObjectId,
  jobId: String,
  queueName: String, // image_validation | image_analysis
  jobType: String,
  status: String, // queued | running | completed | failed | dead_letter
  payloadRef: Object,
  attempts: Number,
  lastError: String,
  startedAt: Date,
  finishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- `{ jobId: 1 } unique`
- `{ queueName: 1, status: 1, createdAt: -1 }`
