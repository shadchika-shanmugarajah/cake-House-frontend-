import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, X, Minimize2, Maximize2, MessageCircle, ImageUp } from 'lucide-react';
import { chatApi } from '../../api/api';
import './Chatbot.css';

const DEFAULT_ACTIONS = [
  {
    key: 'browse_cakes',
    title: 'Browse Cakes',
    description: 'Explore all available cakes',
    message: 'Browse Cakes',
    flow: 'browse_products',
    route_path: '/products',
  },
  {
    key: 'track_order',
    title: 'Track Order',
    description: 'Check your order progress',
    message: 'Track Order',
    flow: 'track_order',
    route_path: '/profile?tab=orders',
  },
  {
    key: 'custom_cake_order',
    title: 'Custom Cake Order',
    description: 'Start a custom design request',
    message: 'Custom Cake Order',
    flow: 'custom_order',
    route_path: '/bulk-order',
  },
  {
    key: 'talk_to_support',
    title: 'Talk to Support',
    description: 'Connect with support options',
    message: 'Talk to Support',
    flow: 'human_support',
    route_path: '/about',
  },
];

const ACTION_ICON_MAP = {
  browse_cakes: '🍰',
  track_order: '📦',
  custom_cake_order: '🎨',
  talk_to_support: '💬',
};

const CHAT_CATEGORY_PAGE_SIZE = 5;
const CUSTOM_MIN_PREP_DAYS = Number(import.meta.env.VITE_CUSTOM_MIN_PREP_DAYS || 2);

const getActionIcon = (key) => {
  if (ACTION_ICON_MAP[key]) return ACTION_ICON_MAP[key];
  if (String(key || '').startsWith('category_')) return '🧁';
  return <MessageCircle size={14} />;
};

const getFlowButtonLabel = (flow, routePath) => {
  if (flow === 'browse_products') return 'Open Cakes';
  if (flow === 'track_order') return 'Open Tracking';
  if (flow === 'custom_order') return 'Open Custom Order';
  if (flow === 'human_support') return 'Open Support';
  if (routePath) return 'Open Flow';
  return '';
};

const makeMessage = (sender, text, extra = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  ...extra,
});

const formatCardPrice = (price, currency) => {
  const numeric = Number(price || 0);
  const symbol = currency || '$';
  return `${symbol}${numeric.toFixed(2)}`;
};

const normalizeProductPagination = (raw = {}) => ({
  page: Number(raw.page || 1),
  limit: Number(raw.limit || CHAT_CATEGORY_PAGE_SIZE),
  total: Number(raw.total || 0),
  total_pages: Number(raw.total_pages || 0),
  has_prev: Boolean(raw.has_prev),
  has_next: Boolean(raw.has_next),
  category: String(raw.category || ''),
  keyword: String(raw.keyword || ''),
  min_price: raw.min_price ?? null,
  max_price: raw.max_price ?? null,
});

const toDateInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMinDeliveryDate = (minDays = CUSTOM_MIN_PREP_DAYS) => {
  const now = new Date();
  now.setDate(now.getDate() + Number(minDays || CUSTOM_MIN_PREP_DAYS));
  now.setHours(0, 0, 0, 0);
  return toDateInputValue(now);
};

const buildInitialCustomForm = (aiPreview = {}) => ({
  ai_description: String(aiPreview?.description || '').trim(),
  flavor: String(aiPreview?.flavor || '').trim(),
  weight_kg: 1,
  message_on_cake: String(aiPreview?.text_on_cake || aiPreview?.textOnCake || '').trim(),
  delivery_date: getMinDeliveryDate(),
  special_instructions: '',
});

const parseApiErrorMessage = (error, fallback = 'Request failed. Please try again.') => {
  const detail = error?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string' && detail.message.trim()) return detail.message;
    if (Array.isArray(detail.errors) && detail.errors.length > 0) return String(detail.errors[0]);
  }
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
};

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customForms, setCustomForms] = useState({});
  const [customFormErrors, setCustomFormErrors] = useState({});
  const [customFormSubmitting, setCustomFormSubmitting] = useState({});
  const [customFormCompleted, setCustomFormCompleted] = useState({});
  const messagesEndRef = useRef(null);
  const uploadInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = async (force = false) => {
    if (!force && (sessionId || isStartingSession)) return sessionId;
    setIsStartingSession(true);

    try {
      const session = await chatApi.startSession({
        channel: 'web',
        locale: 'en',
        context: { entry_point: 'floating_button' },
      });

      setSessionId(session.session_id);
      setMessages((prev) => (
        prev.length
          ? prev
          : [
            makeMessage('bot', session.welcome_message, {
              actionCards: session.quick_actions?.length ? session.quick_actions : DEFAULT_ACTIONS,
            }),
          ]
      ));
      return session.session_id;
    } catch {
      setMessages((prev) => (
        prev.length
          ? prev
          : [
            makeMessage(
              'bot',
              'Welcome to Cake House. Choose a flow to continue: Browse Cakes, Track Order, Custom Cake Order, or Talk to Support.',
              { actionCards: DEFAULT_ACTIONS },
            ),
          ]
      ));
      return '';
    } finally {
      setIsStartingSession(false);
    }
  };

  useEffect(() => {
    if (isOpen) initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sendToBot = async (message, { messageType = 'text', localRoute = '', displayText = '' } = {}) => {
    const trimmed = String(message || '').trim();
    if (!trimmed) return;

    const visibleText = String(displayText || '').trim() || trimmed;
    setMessages((prev) => [...prev, makeMessage('user', visibleText)]);
    setInput('');

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = await initializeSession();
    }

    if (!activeSessionId) {
      if (localRoute) navigate(localRoute);
      return;
    }

    setIsSending(true);
    try {
      let response;
      try {
        response = await chatApi.sendMessage({
          session_id: activeSessionId,
          message: trimmed,
          message_type: messageType,
        });
      } catch (error) {
        const isSessionMissing = Number(error?.status) === 404;
        if (!isSessionMissing) throw error;

        // Session may be stale after server restart; recreate and retry once.
        const newSessionId = await initializeSession(true);
        if (!newSessionId) throw error;
        setSessionId(newSessionId);
        response = await chatApi.sendMessage({
          session_id: newSessionId,
          message: trimmed,
          message_type: messageType,
        });
      }

      const reply = response?.reply || {};
      const routePath = reply.route_path || '';
      const flow = reply.flow || response?.intent?.name || '';

      setMessages((prev) => [
        ...prev,
        makeMessage('bot', reply.text || 'I can help with that.', {
          flow,
          routePath,
          products: reply.products || [],
          productPagination: normalizeProductPagination(reply.product_pagination || {}),
          sampleMessages: reply.sample_messages || [],
          actionCards: reply.action_cards || [],
        }),
      ]);

      if (routePath) {
        setTimeout(() => navigate(routePath), 450);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        makeMessage(
          'bot',
          'I could not reach the assistant service right now. You can still choose a quick action below.',
          { actionCards: DEFAULT_ACTIONS },
        ),
      ]);

      if (localRoute) navigate(localRoute);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => sendToBot(input);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const loadProductsPage = async (pagination, direction) => {
    const current = normalizeProductPagination(pagination || {});
    if (!current.total_pages) return;

    const targetPage = current.page + direction;
    if (targetPage < 1 || targetPage > current.total_pages) return;

    const params = {
      page: targetPage,
      limit: current.limit || CHAT_CATEGORY_PAGE_SIZE,
      category: current.category || '',
      keyword: current.keyword || '',
      min_price: current.min_price,
      max_price: current.max_price,
    };

    setIsSending(true);
    try {
      const response = await chatApi.searchProducts(params);
      const products = response?.items || [];
      const apiPagination = normalizeProductPagination(response?.pagination || {});
      const filters = response?.applied_filters || {};
      const nextPagination = {
        ...apiPagination,
        category: apiPagination.category || String(filters.category || current.category || ''),
        keyword: apiPagination.keyword || String(filters.keyword || current.keyword || ''),
        min_price: apiPagination.min_price ?? filters.min_price ?? current.min_price ?? null,
        max_price: apiPagination.max_price ?? filters.max_price ?? current.max_price ?? null,
      };

      const filterParts = [];
      if (filters.category) filterParts.push(`category: ${filters.category}`);
      if (filters.keyword) filterParts.push(`keyword: ${filters.keyword}`);
      if (filters.max_price !== null && filters.max_price !== undefined) filterParts.push(`price <= $${Number(filters.max_price)}`);
      if (filters.min_price !== null && filters.min_price !== undefined) filterParts.push(`price >= $${Number(filters.min_price)}`);
      const filterText = filterParts.length ? ` (${filterParts.join(', ')})` : '';

      setMessages((prev) => [
        ...prev,
        makeMessage(
          'bot',
          `Here are ${products.length} matching cakes${filterText}. Page ${apiPagination.page} of ${Math.max(apiPagination.total_pages, 1)}.`,
          {
            flow: 'browse_products',
            products,
            productPagination: nextPagination,
            sampleMessages: ['Show birthday cakes', 'Show cakes under $20', 'What categories are available?'],
          },
        ),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        makeMessage('bot', 'I could not load the next set of cakes. Please try again in a moment.'),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const formatUploadError = (error) => {
    return parseApiErrorMessage(error, 'Image upload failed. Please try a clear JPG, PNG, or WEBP cake photo.');
  };

  const updateCustomFormField = (requestId, field, value) => {
    if (!requestId) return;
    setCustomForms((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [field]: value,
      },
    }));
  };

  const validateCustomForm = (formData) => {
    if (!formData) return 'Custom confirmation form is missing.';
    if (!String(formData.flavor || '').trim()) return 'Flavor is required.';
    if (![1, 2, 3].includes(Number(formData.weight_kg || 0))) return 'Weight must be 1kg, 2kg, or 3kg.';
    if (!String(formData.delivery_date || '').trim()) return 'Delivery date is required.';

    const minDate = getMinDeliveryDate(CUSTOM_MIN_PREP_DAYS);
    const selectedDate = new Date(`${formData.delivery_date}T00:00:00`);
    const minDeliveryDate = new Date(`${minDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime()) || selectedDate < minDeliveryDate) {
      return `Selected delivery date is too soon. Custom cakes require at least ${CUSTOM_MIN_PREP_DAYS} days preparation time.`;
    }

    return '';
  };

  const handleCustomFormConfirm = async (requestId) => {
    if (!requestId) return;

    const formData = customForms[requestId];
    const validationError = validateCustomForm(formData);
    if (validationError) {
      setCustomFormErrors((prev) => ({ ...prev, [requestId]: validationError }));
      return;
    }

    setCustomFormErrors((prev) => ({ ...prev, [requestId]: '' }));
    setCustomFormSubmitting((prev) => ({ ...prev, [requestId]: true }));
    try {
      const deliveryCheck = await chatApi.validateCustomDelivery({
        delivery_date: String(formData.delivery_date || '').trim(),
        delivery_slot: '',
        delivery_address_id: '',
      });

      if (!deliveryCheck?.feasible) {
        setCustomFormErrors((prev) => ({
          ...prev,
          [requestId]: String(deliveryCheck?.message || 'Selected delivery schedule is not feasible.'),
        }));
        return;
      }

      const response = await chatApi.confirmCustomOrder(requestId, {
        confirmed: true,
        edited_description: String(formData.ai_description || '').trim(),
        details: {
          flavor: String(formData.flavor || '').trim(),
          weight_kg: Number(formData.weight_kg || 1),
          message_on_cake: String(formData.message_on_cake || '').trim(),
          delivery_date: String(formData.delivery_date || '').trim(),
          special_instructions: String(formData.special_instructions || '').trim(),
        },
      });

      setCustomFormCompleted((prev) => ({ ...prev, [requestId]: true }));
      setMessages((prev) => [
        ...prev,
        makeMessage(
          'bot',
          response?.message || 'Custom order confirmed. It has been sent to admin for quote review.',
        ),
      ]);
    } catch (error) {
      setCustomFormErrors((prev) => ({
        ...prev,
        [requestId]: parseApiErrorMessage(error, 'Could not confirm custom order. Please try again.'),
      }));
    } finally {
      setCustomFormSubmitting((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleImageButtonClick = () => {
    uploadInputRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      makeMessage('user', `Uploading image: ${file.name}`, { imagePreview: localPreview }),
    ]);

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = await initializeSession();
    }

    setIsUploadingImage(true);
    try {
      const upload = await chatApi.uploadCustomImage(file, activeSessionId);
      const qualityScore = Number(upload?.image_meta?.quality_score || 0);
      const warnings = Array.isArray(upload?.validation?.warnings) ? upload.validation.warnings : [];
      const aiPreview = upload?.ai_preview || upload?.aiPreview || null;
      const requestId = String(upload?.request_id || upload?.requestId || '').trim();
      const aiDescription = String(aiPreview?.description || '').trim();
      const aiStatus = String(aiPreview?.status || '').trim().toLowerCase();
      const aiError = String(aiPreview?.error_message || aiPreview?.errorMessage || '').trim();
      const confidence = Number(aiPreview?.confidence || 0);

      const aiSummary = aiDescription
        ? `AI description: ${aiDescription}${confidence > 0 ? ` (confidence ${Math.round(confidence * 100)}%)` : ''}`
        : (aiStatus === 'not_configured'
          ? 'AI description is currently unavailable on server configuration.'
          : (aiError || 'AI description is not ready yet.'));

      if (requestId) {
        setCustomForms((prev) => ({
          ...prev,
          [requestId]: buildInitialCustomForm(aiPreview || {}),
        }));
      }

      setMessages((prev) => [
        ...prev,
        makeMessage(
          'bot',
          `Image uploaded successfully. Quality score: ${qualityScore}/100. ${aiSummary}`,
          {
            imagePreview: upload?.preview_url || upload?.file_url || '',
            sampleMessages: warnings.length ? [warnings[0]] : [],
            customConfirmRequestId: requestId,
            customAiPreview: aiPreview || {},
            actionCards: [
              {
                key: 'custom_cake_order',
                title: requestId ? 'Review & Confirm' : 'Custom Cake Order',
                description: requestId ? 'Confirm your edited custom cake details' : 'Continue custom order flow',
                message: 'Custom Cake Order',
                flow: 'custom_order',
                route_path: '/bulk-order',
              },
            ],
          },
        ),
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        makeMessage(
          'bot',
          formatUploadError(error),
          {
            actionCards: [{
              key: 'custom_cake_order',
              title: 'Try Another Image',
              description: 'Upload a different cake image',
              message: 'Custom Cake Order',
              flow: 'custom_order',
              route_path: '',
            }],
          },
        ),
      ]);
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
      URL.revokeObjectURL(localPreview);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)} aria-label="Open chatbot">
          <Bot size={24} />
          <span className="pulse-dot"></span>
        </button>
      )}

      {isOpen && (
        <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} />
              <span>Cake Assistant</span>
              <span className="status-dot"></span>
            </div>
            <div className="chatbot-controls">
              <button onClick={() => setIsMinimized(!isMinimized)} className="control-btn" aria-label="Toggle chat size">
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="control-btn" aria-label="Close chatbot">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map((msg) => {
                  const customRequestId = String(msg.customConfirmRequestId || '').trim();
                  const customForm = customRequestId ? customForms[customRequestId] : null;
                  const customError = customRequestId ? customFormErrors[customRequestId] : '';
                  const customSubmitting = Boolean(customRequestId && customFormSubmitting[customRequestId]);
                  const customCompleted = Boolean(customRequestId && customFormCompleted[customRequestId]);
                  const minDeliveryDate = getMinDeliveryDate();

                  return (
                    <div
                      key={msg.id}
                      className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
                    >
                    <div className="message-content">{msg.text}</div>
                    {msg.imagePreview && (
                      <img
                        className="chatbot-upload-preview"
                        src={msg.imagePreview}
                        alt="Cake reference preview"
                      />
                    )}

                    {msg.sender === 'bot' && customRequestId && customForm && (
                      <div className="chatbot-custom-form">
                        <div className="chatbot-custom-summary">
                          <h4>AI Summary</h4>
                          <p>{customForm.ai_description || 'No AI summary generated. Please enter your details manually.'}</p>
                        </div>

                        <label className="chatbot-custom-label">
                          Edit AI Description
                          <textarea
                            value={customForm.ai_description}
                            onChange={(event) => updateCustomFormField(customRequestId, 'ai_description', event.target.value)}
                            disabled={customSubmitting || customCompleted}
                            rows={3}
                          />
                        </label>

                        <div className="chatbot-custom-grid">
                          <label className="chatbot-custom-label">
                            Flavor
                            <input
                              type="text"
                              value={customForm.flavor}
                              onChange={(event) => updateCustomFormField(customRequestId, 'flavor', event.target.value)}
                              disabled={customSubmitting || customCompleted}
                              placeholder="Chocolate, Vanilla, Red Velvet..."
                            />
                          </label>

                          <label className="chatbot-custom-label">
                            Weight
                            <select
                              value={Number(customForm.weight_kg || 1)}
                              onChange={(event) => updateCustomFormField(customRequestId, 'weight_kg', Number(event.target.value))}
                              disabled={customSubmitting || customCompleted}
                            >
                              <option value={1}>1kg</option>
                              <option value={2}>2kg</option>
                              <option value={3}>3kg</option>
                            </select>
                          </label>
                        </div>

                        <label className="chatbot-custom-label">
                          Message On Cake
                          <input
                            type="text"
                            value={customForm.message_on_cake}
                            onChange={(event) => updateCustomFormField(customRequestId, 'message_on_cake', event.target.value)}
                            disabled={customSubmitting || customCompleted}
                            placeholder="Happy Birthday..."
                          />
                        </label>

                        <label className="chatbot-custom-label">
                          Delivery Date
                          <input
                            type="date"
                            value={customForm.delivery_date}
                            min={minDeliveryDate}
                            onChange={(event) => updateCustomFormField(customRequestId, 'delivery_date', event.target.value)}
                            disabled={customSubmitting || customCompleted}
                          />
                        </label>

                        <label className="chatbot-custom-label">
                          Special Instructions
                          <textarea
                            value={customForm.special_instructions}
                            onChange={(event) => updateCustomFormField(customRequestId, 'special_instructions', event.target.value)}
                            disabled={customSubmitting || customCompleted}
                            rows={3}
                            placeholder="Eggless, less sugar, no nuts, extra cream..."
                          />
                        </label>

                        {customError ? (
                          <p className="chatbot-form-error">{customError}</p>
                        ) : null}

                        {customCompleted ? (
                          <p className="chatbot-form-success">Custom order confirmed and sent to admin.</p>
                        ) : (
                          <button
                            className="chatbot-custom-confirm-btn"
                            type="button"
                            disabled={customSubmitting}
                            onClick={() => handleCustomFormConfirm(customRequestId)}
                          >
                            {customSubmitting ? 'Confirming...' : 'Confirm Request'}
                          </button>
                        )}
                      </div>
                    )}

                    {msg.sender === 'bot' && Array.isArray(msg.products) && msg.products.length > 0 && (
                      <>
                        <div className="chatbot-product-grid">
                          {msg.products.map((product) => (
                            <div className="chatbot-product-card" key={product.product_id}>
                              <img
                                className="chatbot-product-image"
                                src={product.image || 'https://via.placeholder.com/300x180?text=Cake'}
                                alt={product.name}
                              />
                              <div className="chatbot-product-body">
                                <h4>{product.name}</h4>
                                <p className="chatbot-product-price">{formatCardPrice(product.price, product.currency)}</p>
                                <p className="chatbot-product-desc">{product.short_description}</p>
                                <div className="chatbot-product-actions">
                                  {(product.actions || []).map((action) => (
                                    <button
                                      key={`${product.product_id}-${action.key}`}
                                      className={`chatbot-product-btn ${action.key === 'order_now' ? 'primary' : ''}`}
                                      onClick={() => {
                                        if (action.action_type === 'chat_message' && action.message) {
                                          sendToBot(action.message, { messageType: 'quick_action', displayText: action.label });
                                          return;
                                        }
                                        if (action.route_path) navigate(action.route_path);
                                      }}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {msg.productPagination && Number(msg.productPagination.total_pages || 0) >= 1 && (
                          <div className="chatbot-pagination-row">
                            <button
                              className="chatbot-pagination-btn"
                              disabled={!msg.productPagination.has_prev || isSending}
                              onClick={() => loadProductsPage(msg.productPagination, -1)}
                            >
                              Previous
                            </button>
                            <span className="chatbot-pagination-label">
                              Page {msg.productPagination.page} of {msg.productPagination.total_pages}
                            </span>
                            <button
                              className="chatbot-pagination-btn"
                              disabled={!msg.productPagination.has_next || isSending}
                              onClick={() => loadProductsPage(msg.productPagination, 1)}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {msg.sender === 'bot' && Array.isArray(msg.actionCards) && msg.actionCards.length > 0 && (
                      <div className="chatbot-action-grid">
                        {msg.actionCards.map((action) => (
                          <button
                            key={action.key}
                            className="chatbot-action-card"
                            onClick={() => sendToBot(action.message || action.title, {
                              messageType: 'quick_action',
                              localRoute: action.route_path,
                              displayText: action.title,
                            })}
                          >
                            <span className="chatbot-action-icon">{getActionIcon(action.key)}</span>
                            <span className="chatbot-action-title">{action.title}</span>
                            <span className="chatbot-action-desc">{action.description}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.sender === 'bot' && Array.isArray(msg.sampleMessages) && msg.sampleMessages.length > 0 && (
                      <div className="chatbot-sample-row">
                        {msg.sampleMessages.map((sample) => (
                          <button
                            key={sample}
                            className="chatbot-sample-btn"
                            onClick={() => sendToBot(sample)}
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.sender === 'bot' && msg.routePath && (
                      <button
                        className="chatbot-route-btn"
                        onClick={() => navigate(msg.routePath)}
                      >
                        {getFlowButtonLabel(msg.flow, msg.routePath)}
                      </button>
                    )}

                    <div className="message-time">{msg.time}</div>
                    </div>
                  );
                })}

                {isSending && (
                  <div className="message bot-message">
                    <div className="message-content">Typing...</div>
                  </div>
                )}
                {isUploadingImage && (
                  <div className="message bot-message">
                    <div className="message-content">Validating and uploading image...</div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input">
                <input
                  type="file"
                  ref={uploadInputRef}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageSelected}
                />
                <button
                  type="button"
                  onClick={handleImageButtonClick}
                  className="send-btn upload-btn"
                  disabled={isSending || isStartingSession || isUploadingImage}
                  title="Upload cake image"
                >
                  <ImageUp size={18} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message or choose an option..."
                />
                <button onClick={handleSend} className="send-btn" disabled={isSending || isStartingSession || isUploadingImage}>
                  <Send size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
