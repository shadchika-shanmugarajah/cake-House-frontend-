# AI Chatbot + Custom Cake Ordering Specs

This folder contains implementation-ready specifications:

- `folder-structure.md`: monorepo/project layout and service boundaries.
- `mongo-schema-drafts.md`: MongoDB collection drafts with index guidance.
- `endpoint-contracts.md`: API request/response JSON contracts, websocket events, and queue payloads.

Suggested build order:
1. Set up `chat-api-fastapi` skeleton and auth middleware.
2. Create Mongo collections and indexes from `mongo-schema-drafts.md`.
3. Implement chat endpoints and custom order state machine.
4. Wire queue workers for image validation and AI analysis.
5. Integrate frontend chatbot module with endpoint contracts.
