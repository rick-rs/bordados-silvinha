from datetime import datetime, timedelta
from decimal import Decimal
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
def test_pedido_precisa_matriz_verdadeiro_por_padrao(api_client, cliente):
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
    assert resp.json()["precisa_matriz"] is True


@pytest.mark.django_db
def test_pedido_pode_nao_precisar_matriz(api_client, cliente):
    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "forma_pagamento": "Pix",
            "prazo": (timezone.localdate() + timedelta(days=2)).isoformat(),
            "precisa_matriz": False,
        },
        format="json",
    )

    assert resp.status_code == 201
    assert resp.json()["precisa_matriz"] is False


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("total", "pago", "expected_status"),
    [
        ("49.99", "0.00", 201),
        ("50.00", "24.99", 400),
        ("50.00", "25.00", 201),
        ("100.00", "49.99", 400),
        ("100.00", "50.00", 201),
    ],
)
def test_pedido_valida_limite_para_liberar_producao(
    api_client, cliente, total, pago, expected_status
):
    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "forma_pagamento": "Pix",
            "prazo": (timezone.localdate() + timedelta(days=2)).isoformat(),
            "valor_total": total,
            "valor_pago": pago,
            "status": "Em Producao",
        },
        format="json",
    )

    assert resp.status_code == expected_status
    if expected_status == 201:
        assert resp.json()["liberado_financeiro"] is True


@pytest.mark.django_db
def test_pedido_calcula_saldo_e_status_pagamento(api_client, cliente):
    payload = {
        "cliente": cliente.id,
        "forma_pagamento": "Pix",
        "prazo": (timezone.localdate() + timedelta(days=2)).isoformat(),
        "valor_total": "100.00",
        "status_pagamento": "Pago",
    }
    resp = api_client.post("/api/pedidos/", payload, format="json")

    assert resp.status_code == 201
    assert resp.json()["status_pagamento"] == "Pendente"
    assert resp.json()["valor_pago"] == "0.00"
    assert resp.json()["saldo_restante"] == "100.00"
    assert resp.json()["liberado_financeiro"] is False

    pedido_id = resp.json()["id"]
    resp = api_client.patch(
        f"/api/pedidos/{pedido_id}/", {"valor_pago": "25.00"}, format="json"
    )

    assert resp.status_code == 200
    assert resp.json()["status_pagamento"] == "Parcial"
    assert resp.json()["saldo_restante"] == "75.00"
    assert resp.json()["liberado_financeiro"] is False

    resp = api_client.patch(
        f"/api/pedidos/{pedido_id}/", {"valor_pago": "50.00"}, format="json"
    )

    assert resp.status_code == 200
    assert resp.json()["status_pagamento"] == "Parcial"
    assert resp.json()["saldo_restante"] == "50.00"
    assert resp.json()["liberado_financeiro"] is True

    resp = api_client.patch(
        f"/api/pedidos/{pedido_id}/", {"valor_pago": "100.00"}, format="json"
    )

    assert resp.status_code == 200
    assert resp.json()["status_pagamento"] == "Pago"
    assert resp.json()["saldo_restante"] == "0.00"


@pytest.mark.django_db
def test_pedido_nao_aceita_pagamento_fora_do_intervalo(api_client, cliente):
    resp = api_client.post(
        "/api/pedidos/",
        {
            "cliente": cliente.id,
            "forma_pagamento": "Pix",
            "prazo": (timezone.localdate() + timedelta(days=2)).isoformat(),
            "valor_total": "50.00",
            "valor_pago": "50.01",
        },
        format="json",
    )

    assert resp.status_code == 400
    assert "valor_pago" in resp.json()


@pytest.mark.django_db
def test_edicao_pedido_exige_pagamento_antes_da_producao(api_client, cliente):
    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
        valor_total=Decimal("50.00"),
    )

    resp = api_client.patch(
        f"/api/pedidos/{pedido.id}/", {"status": "Em Producao"}, format="json"
    )

    assert resp.status_code == 400
    assert "status" in resp.json()

    resp = api_client.patch(
        f"/api/pedidos/{pedido.id}/",
        {"status": "Em Producao", "valor_pago": "25.00"},
        format="json",
    )

    assert resp.status_code == 200
    assert resp.json()["liberado_financeiro"] is True


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
