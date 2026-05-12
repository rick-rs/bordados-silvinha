"""Dashboard aggregation rules."""

from decimal import Decimal

from django.db.models import F, Sum
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
    quantity = f"{material.quantidade_atual:g}"
    minimum = f"{material.estoque_minimo:g}"
    return f"Apenas {quantity} {material.unidade_medida} (Min: {minimum})"


def get_dashboard_summary() -> dict:
    """Build all dashboard metrics and lists."""
    today = timezone.localdate()
    month_orders = models.Pedido.objects.filter(
        data_pedido__year=today.year,
        data_pedido__month=today.month,
        status_pagamento="Pago",
    )
    open_orders = models.Pedido.objects.filter(status__in=OPEN_ORDER_STATUSES)
    overdue_orders = open_orders.filter(prazo__lt=today)
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
        },
        "deadline_alerts": [
            {
                "id": pedido.id,
                "order": f"#{pedido.id:03d} - {pedido.cliente.nome}",
                "description": pedido.observacoes or order_status_label(pedido.status),
                "status": "Atrasado",
                "due_date": f"Prazo {format_date(pedido.prazo)}",
            }
            for pedido in overdue_orders.select_related("cliente").order_by(
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
