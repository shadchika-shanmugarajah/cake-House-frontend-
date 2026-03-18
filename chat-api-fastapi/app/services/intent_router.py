from __future__ import annotations

import re


class IntentRouter:
    def detect(self, message: str) -> tuple[str, float]:
        text = (message or '').strip().lower()

        if text in {'browse cakes', 'browse cake'}:
            return 'browse_products', 0.99
        if text in {'what categories are available', 'categories', 'show categories'}:
            return 'browse_categories', 0.99
        if text in {'track order', 'track my order'}:
            return 'track_order', 0.99
        if text in {'order cake', 'place order', 'order now', 'buy cake'}:
            return 'chat_order', 0.99
        if text in {'custom cake order', 'custom cake', 'order custom cake'}:
            return 'custom_order', 0.99
        if text in {'talk to support', 'support', 'talk to human'}:
            return 'human_support', 0.99

        if re.search(r'\b(categories|category|types of cakes)\b', text):
            return 'browse_categories', 0.97
        if re.search(r'\b(custom|design|photo|image|upload)\b', text):
            return 'custom_order', 0.95
        if re.search(r'\b(track|status|where\s+is\s+my\s+order)\b', text):
            return 'track_order', 0.92
        if re.search(r'\b(order|buy|checkout)\b', text):
            return 'chat_order', 0.9
        if re.search(r'\b(product|cake|browse|show|menu|flavor|chocolate|vanilla|red velvet)\b', text):
            return 'browse_products', 0.88
        if re.search(r'\b(help|agent|human|support)\b', text):
            return 'human_support', 0.9

        return 'general_chat', 0.6
