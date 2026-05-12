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
    }
    assert data["deadline_alerts"] == []
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
    assert data["metrics"]["orders_in_progress"] == 1
    assert data["metrics"]["monthly_revenue"] == "R$ 150,00"
    assert data["metrics"]["overdue_orders"] == 1
    assert data["metrics"]["stock_alerts"] == 1
    assert data["deadline_alerts"][0]["status"] == "Atrasado"
    assert data["stock_replacements"][0]["name"] == "Linha Rosa"
    assert data["recent_orders"][0]["client"] == "Cliente Teste"
