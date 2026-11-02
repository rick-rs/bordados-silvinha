from datetime import timedelta

import pytest
from django.utils import timezone


@pytest.mark.django_db
def test_historico_status_create(api_client, cliente, usuario):
    # create pedido
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
    pedido_id = resp.json()["id"]

    payload = {"pedido": pedido_id, "usuario": usuario.id, "status": "Recebido"}
    resp = api_client.post("/api/historico-status/", payload, format="json")
    assert resp.status_code == 405

    resp = api_client.get("/api/historico-status/")
    assert resp.status_code == 200


@pytest.mark.django_db
def test_historico_nao_autenticado_nao_e_exposto(anonymous_api_client):
    assert anonymous_api_client.get("/api/historico-status/").status_code == 401
