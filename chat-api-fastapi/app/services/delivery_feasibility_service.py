from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.core.config import get_settings
from app.services.commerce_client import commerce_client


@dataclass
class DeliveryFeasibilityResult:
    feasible: bool
    message: str
    status_code: int
    rules: dict


class DeliveryFeasibilityService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _rules(self) -> dict:
        return {
            'minPreparationDays': int(self.settings.min_custom_delivery_lead_days),
            'slotCapacityCheckEnabled': bool(self.settings.custom_delivery_check_slot_capacity),
        }

    async def validate_custom_order_delivery(
        self,
        *,
        delivery_date: date,
        delivery_slot: str = '',
        delivery_address_id: str = '',
        token: str | None = None,
    ) -> DeliveryFeasibilityResult:
        rules = self._rules()
        min_days = int(rules['minPreparationDays'])
        days_ahead = (delivery_date - date.today()).days

        if days_ahead < min_days:
            return DeliveryFeasibilityResult(
                feasible=False,
                message=(
                    f'Selected delivery date is too soon. '
                    f'Custom cakes require at least {min_days} days preparation time.'
                ),
                status_code=400,
                rules=rules,
            )

        slot_check_enabled = bool(rules['slotCapacityCheckEnabled'])
        has_slot_data = bool(str(delivery_address_id or '').strip() and str(delivery_slot or '').strip())
        if slot_check_enabled and has_slot_data:
            feasible, reason = await commerce_client.check_delivery_feasibility(
                delivery_address_id,
                str(delivery_date),
                delivery_slot,
                token=token,
            )
            if not feasible:
                return DeliveryFeasibilityResult(
                    feasible=False,
                    message=(
                        str(reason).strip()
                        if str(reason or '').strip()
                        else 'Selected delivery slot is full for that date. Please choose another slot or date.'
                    ),
                    status_code=409,
                    rules=rules,
                )

        return DeliveryFeasibilityResult(
            feasible=True,
            message='Selected delivery schedule is feasible for custom cake preparation.',
            status_code=200,
            rules=rules,
        )


delivery_feasibility_service = DeliveryFeasibilityService()
