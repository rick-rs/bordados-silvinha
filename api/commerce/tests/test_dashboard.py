from datetime import timedelta

import pytest
from django.utils import timezone

from commerce import models


@pytest.mark.django_db
def test_dashboard_summary_empty(api_client):
    resp = api_client.get("/api/pedidos/dashboard/")

    assert resp.status_code == 200
    data = resp.json()
    assert data["metrics"] == {
        "orders_in_progress": 0,
        "monthly_revenue": "R$ 0,00",
        "overdue_orders": 0,
        "stock_alerts": 0,
        "urgent_orders": 0,
        "pending_payments": 0,
        "pending_payments_value": "R$ 0,00",
    }
    assert data["orders_by_status"] == []
    assert data["deadline_alerts"] == []
    assert data["urgent_orders"] == []
    assert data["stock_replacements"] == []
    assert data["recent_orders"] == []


@pytest.mark.django_db
def test_dashboard_summary_calculates_metrics(api_client):
    today = timezone.localdate()
    cliente = models.Cliente.objects.create(nome="Cliente Teste")
    models.Pedido.objects.create(
        cliente=cliente,
        data_pedido=today,
        prazo=today - timedelta(days=1),
        valor_total=150,
        status_pagamento="Pago",
        status="Em Producao",
        urgente=True,
    )
    models.Pedido.objects.create(
        cliente=cliente,
        prazo=today + timedelta(days=2),
        valor_total=50,
        status_pagamento="Pendente",
        status="Recebido",
    )
    models.Pedido.objects.create(
        cliente=cliente,
        data_pedido=today,
        prazo=today + timedelta(days=3),
        valor_total=80,
        status_pagamento="Parcial",
        status="Recebido",
    )
    models.Pedido.objects.create(
        cliente=cliente,
        data_pedido=today,
        prazo=today + timedelta(days=2),
        valor_total=40,
        status_pagamento="Pago",
        status="Cancelado",
        motivo_cancelamento="Cliente desistiu.",
    )
    models.Material.objects.create(
        nome="Linha Rosa",
        unidade_medida="cone",
        quantidade_atual=1,
        estoque_minimo=2,
    )

    resp = api_client.get("/api/pedidos/dashboard/")

    assert resp.status_code == 200
    data = resp.json()
    assert data["metrics"]["orders_in_progress"] == 3
    assert data["metrics"]["monthly_revenue"] == "R$ 230,00"
    assert data["metrics"]["overdue_orders"] == 1
    assert data["metrics"]["stock_alerts"] == 1
    assert data["metrics"]["urgent_orders"] == 1
    assert data["metrics"]["pending_payments"] == 2
    assert data["metrics"]["pending_payments_value"] == "R$ 130,00"
    assert {"status": "Em Produção", "count": 1} in data["orders_by_status"]
    assert data["deadline_alerts"][0]["status"] == "Atrasado"
    assert data["deadline_alerts"][0]["urgent"] is True
    assert data["urgent_orders"][0]["client"] == "Cliente Teste"
    assert data["stock_replacements"][0]["name"] == "Linha Rosa"
    assert data["recent_orders"][0]["client"] == "Cliente Teste"
