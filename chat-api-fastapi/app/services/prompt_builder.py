from datetime import date


def build_general_prompt(user_text: str) -> str:
    return (
        'You are Cake House assistant. Keep responses short, friendly, and action-oriented. '
        f'User message: {user_text}'
    )


def build_image_analysis_prompt(customer_inputs: dict) -> str:
    return (
        'Analyze this cake reference image and return structured details: '
        'style, colors, tiers, decorations, and concise description. '
        f'Context: {customer_inputs}'
    )


def is_valid_delivery_date(delivery_date: date, min_lead_days: int) -> bool:
    return (delivery_date - date.today()).days >= min_lead_days
