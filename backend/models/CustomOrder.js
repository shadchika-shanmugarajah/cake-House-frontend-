import mongoose from 'mongoose';

const customOrderStatusValues = [
  'draft',
  'submitted',
  'ai_processing',
  'awaiting_user_confirmation',
  'awaiting_admin_quote',
  'quoted',
  'awaiting_user_acceptance',
  'awaiting_user_payment',
  'price_rejected',
  'price_accepted',
  'approved',
  'rejected',
  'in_progress',
  'ready',
  'packed',
  'out_for_delivery',
  'delivered',
  'converted_to_order',
  'cancelled',
];

const customOrderRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, trim: true },
  userId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  sessionId: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  imageMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
  customerInputs: {
    occasion: { type: String, default: '' },
    servings: { type: Number, default: 10 },
    flavor: { type: String, default: '' },
    weightKg: { type: Number, default: null },
    messageOnCake: { type: String, default: '' },
    specialInstructions: { type: String, default: '' },
    deliveryDate: { type: Date, default: null },
    deliverySlot: { type: String, default: '' },
    deliveryAddressId: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  aiResult: {
    description: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    extractedAttributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: 'pending' },
    errorMessage: { type: String, default: '' },
  },
  userConfirmation: {
    confirmed: { type: Boolean, default: false },
    editedDescription: { type: String, default: '' },
    confirmedData: { type: mongoose.Schema.Types.Mixed, default: null },
    confirmedAt: { type: Date, default: null },
  },
  adminQuote: {
    quotedPrice: { type: Number, default: null },
    quoteNotes: { type: String, default: '' },
    preparationDays: { type: Number, default: null },
    quotedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    quotedAt: { type: Date, default: null },
  },
  pricingHistory: [{
    quotedPrice: { type: Number, default: null },
    preparationDays: { type: Number, default: null },
    quoteNotes: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    source: { type: String, default: '' },
    statusAfterUpdate: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedAt: { type: Date, default: Date.now },
  }],
  adminReview: {
    editedDescription: { type: String, default: '' },
    notes: { type: String, default: '' },
    decision: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    reviewedAt: { type: Date, default: null },
  },
  userDecision: {
    decision: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    reason: { type: String, default: '' },
    decidedAt: { type: Date, default: null },
  },
  userDecisionHistory: [{
    decision: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    reason: { type: String, default: '' },
    decidedAt: { type: Date, default: Date.now },
  }],
  paymentMethod: {
    type: String,
    default: '',
    enum: ['', 'online', 'cash_on_delivery'],
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded'],
  },
  payment: {
    provider: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    reference: { type: String, default: '' },
    status: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  generatedOrderId: { type: String, default: '' },
  convertedToOrderAt: { type: Date, default: null },
  status: {
    type: String,
    default: 'ai_processing',
    enum: customOrderStatusValues,
    index: true,
  },
  lock: {
    isLocked: { type: Boolean, default: false },
    lockReason: { type: String, default: '' },
    lockedBy: { type: String, default: '' },
    lockedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
}, {
  collection: 'custom_order_requests',
  timestamps: true,
});

customOrderRequestSchema.index({ createdAt: -1 });
customOrderRequestSchema.index({ userId: 1, createdAt: -1 });

customOrderRequestSchema.virtual('id').get(function idGetter() {
  return this.requestId;
});

customOrderRequestSchema.set('toJSON', { virtuals: true });
customOrderRequestSchema.set('toObject', { virtuals: true });

export default mongoose.model('CustomOrderRequest', customOrderRequestSchema);
