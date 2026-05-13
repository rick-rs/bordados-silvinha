from datetime import timedelta

import pytest
from django.utils import timezone


@pytest.mark.django_db
def test_itempedido_subtotal_model(produto, cliente):
    from commerce import models

    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
    )
    item = models.ItemPedido(
        pedido=pedido, produto=produto, quantidade=3, valor_unitario=12.5
    )
    item.save()
    assert float(item.subtotal) == pytest.approx(37.5)


@pytest.mark.django_db
def test_itempedido_api_crud(api_client, produto, cliente):
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

    payload = {
        "pedido": pedido_id,
        "produto": produto.id,
        "quantidade": 2,
        "valor_unitario": "7.50",
    }
    resp = api_client.post("/api/itens-pedido/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert float(data.get("subtotal", 0)) == pytest.approx(15.0)
