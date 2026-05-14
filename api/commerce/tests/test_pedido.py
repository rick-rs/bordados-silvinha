from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from django.test import override_settings
from django.utils import timezone

from commerce import models


@pytest.mark.django_db
def test_pedido_create_and_crud(api_client, cliente):
    # Create pedido referencing existing cliente
    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "forma_pagamento": "Pix",
            "prazo": (timezone.localdate() + timedelta(days=2)).isoformat(),
        },
        format="json",
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["data_pedido"] == timezone.localdate().isoformat()
    pid = data["id"]

    resp = api_client.get(f"/api/pedidos/{pid}/")
    assert resp.status_code == 200

    resp = api_client.patch(
        f"/api/pedidos/{pid}/", {"valor_total": "12.34"}, format="json"
    )
    assert resp.status_code in (200, 202)

    resp = api_client.delete(f"/api/pedidos/{pid}/")
    assert resp.status_code in (204, 200, 202)


@pytest.mark.django_db
def test_pedido_exige_forma_pagamento(api_client, cliente):
    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "prazo": (timezone.localdate() + timedelta(days=2)).isoformat(),
        },
        format="json",
    )

    assert resp.status_code == 400
    assert "forma_pagamento" in resp.json()


@pytest.mark.django_db
def test_pedido_valida_prazo_futuro(api_client, cliente):
    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "forma_pagamento": "Pix",
            "prazo": timezone.localdate().isoformat(),
        },
        format="json",
    )

    assert resp.status_code == 400
    assert "prazo" in resp.json()


@pytest.mark.django_db
@override_settings(TIME_ZONE="America/Sao_Paulo")
def test_pedido_usa_data_local_para_validar_prazo(api_client, cliente, monkeypatch):
    mocked_now = datetime(2026, 5, 14, 2, 30, tzinfo=ZoneInfo("UTC"))
    monkeypatch.setattr(timezone, "now", lambda: mocked_now)

    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "forma_pagamento": "Pix",
            "prazo": "2026-05-14",
        },
        format="json",
    )

    assert timezone.localdate() == datetime(2026, 5, 13).date()
    assert resp.status_code == 201


@pytest.mark.django_db
def test_pedido_status_gera_historico_e_entrega(api_client, cliente):
    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
    )

    resp = api_client.patch(
        f"/api/pedidos/{pedido.id}/",
        {"status": "Entregue", "observacoes_entrega": "Retirado pela cliente."},
        format="json",
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["data_entrega"] == timezone.localdate().isoformat()
    historico = models.HistoricoStatus.objects.get(pedido=pedido)
    assert historico.status_anterior == "Recebido"
    assert historico.status_novo == "Entregue"
    assert historico.motivo == "Retirado pela cliente."


@pytest.mark.django_db
def test_pedido_cancelamento_exige_motivo(api_client, cliente):
    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
    )

    resp = api_client.patch(
        f"/api/pedidos/{pedido.id}/", {"status": "Cancelado"}, format="json"
    )

    assert resp.status_code == 400
    assert "motivo_cancelamento" in resp.json()


@pytest.mark.django_db
def test_pedido_terminal_nao_muda_status(api_client, cliente):
    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
        status="Entregue",
    )

    resp = api_client.patch(
        f"/api/pedidos/{pedido.id}/", {"status": "Em Producao"}, format="json"
    )

    assert resp.status_code == 400
    assert "status" in resp.json()


@pytest.mark.django_db
def test_item_pedido_registra_local_bordado(api_client, cliente, produto):
    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
    )

    resp = api_client.post(
        "/api/itens-pedido/",
        {
            "pedido": pedido.id,
            "produto": produto.id,
            "peca": "Toalha",
            "local_bordado": "Barra inferior",
            "quantidade": 1,
            "valor_unitario": "20.00",
        },
        format="json",
    )

    assert resp.status_code == 201
    assert resp.json()["local_bordado"] == "Barra inferior"
