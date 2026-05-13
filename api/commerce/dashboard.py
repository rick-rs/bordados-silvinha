"""Dashboard aggregation rules."""

from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, F, Sum
from django.utils import timezone

from . import models

OPEN_ORDER_STATUSES = [
    "Recebido",
    "Aguardando Matriz",
    "Em Producao",
    "Pronto para Entrega",
]


def money(value: Decimal | None) -> str:
    """Format a decimal value for dashboard display."""
    amount = value or Decimal("0")
    formatted = f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"


def format_date(value) -> str:
    """Format dates for dashboard display."""
    if not value:
        return "-"

    return value.strftime("%d/%m/%Y")


def payment_label(value: str | None) -> str:
    """Return a display label for payment status."""
    return value or "Pendente"


def order_status_label(value: str | None) -> str:
    """Return a display label for order status."""
    if value == "Em Producao":
        return "Em Produção"

    return value or "Recebido"


def stock_remaining_label(material: models.Material) -> str:
    """Return remaining stock label for a material."""
    quantity = f"{material.quantidade_atual:.2f}".rstrip("0").rstrip(".")
    minimum = f"{material.estoque_minimo:.2f}".rstrip("0").rstrip(".")
    unit = material.unidade_medida

    if material.quantidade_atual != 1 and unit in {"cone", "metro", "rolo", "kg"}:
        unit = f"{unit}s"

    return f"Apenas {quantity} {unit} (Min: {minimum})"


def get_dashboard_summary() -> dict:
    """Build all dashboard metrics and lists."""
    today = timezone.localdate()
    soon_limit = today + timedelta(days=3)
    month_orders = models.Pedido.objects.filter(
        data_pedido__year=today.year,
        data_pedido__month=today.month,
        status_pagamento="Pago",
    )
    open_orders = models.Pedido.objects.filter(status__in=OPEN_ORDER_STATUSES)
    overdue_orders = open_orders.filter(prazo__lt=today)
    due_soon_orders = open_orders.filter(prazo__gte=today, prazo__lte=soon_limit)
    urgent_orders = open_orders.filter(urgente=True)
    pending_payment_orders = models.Pedido.objects.exclude(status_pagamento="Pago")
    stock_alerts = models.Material.objects.filter(
        quantidade_atual__lte=F("estoque_minimo")
    ).order_by("nome")
    recent_orders = models.Pedido.objects.select_related("cliente").order_by(
        "-criado_em", "-id"
    )[:8]

    revenue = month_orders.aggregate(total=Sum("valor_total"))["total"]

    return {
        "metrics": {
            "orders_in_progress": open_orders.count(),
            "monthly_revenue": money(revenue),
            "overdue_orders": overdue_orders.count(),
            "stock_alerts": stock_alerts.count(),
            "urgent_orders": urgent_orders.count(),
            "pending_payments": pending_payment_orders.count(),
        },
        "orders_by_status": [
            {
                "status": order_status_label(item["status"]),
                "count": item["total"],
            }
            for item in models.Pedido.objects.values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        ],
        "deadline_alerts": [
            {
                "id": pedido.id,
                "order": pedido.cliente.nome,
                "description": pedido.observacoes or order_status_label(pedido.status),
                "status": "Atrasado" if pedido.prazo < today else "Prazo proximo",
                "due_date": f"Prazo {format_date(pedido.prazo)}",
                "overdue_days": max((today - pedido.prazo).days, 0),
                "days_until_due": max((pedido.prazo - today).days, 0),
                "urgent": pedido.urgente,
            }
            for pedido in open_orders.filter(prazo__lte=soon_limit)
            .select_related("cliente")
            .order_by("prazo", "-urgente", "id")[:8]
        ],
        "urgent_orders": [
            {
                "id": pedido.id,
                "client": pedido.cliente.nome,
                "due_date": format_date(pedido.prazo),
                "status": order_status_label(pedido.status),
            }
            for pedido in urgent_orders.select_related("cliente").order_by(
                "prazo", "id"
            )[:6]
        ],
        "stock_replacements": [
            {
                "id": material.id,
                "name": material.nome,
                "remaining": stock_remaining_label(material),
            }
            for material in stock_alerts[:6]
        ],
        "recent_orders": [
            {
                "id": pedido.id,
                "number": f"#{pedido.id:03d}",
                "client": pedido.cliente.nome,
                "due_date": format_date(pedido.prazo),
                "status": order_status_label(pedido.status),
                "payment": payment_label(pedido.status_pagamento),
            }
            for pedido in recent_orders
        ],
    }
