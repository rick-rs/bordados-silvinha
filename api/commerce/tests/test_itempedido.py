from datetime import timedelta

import pytest
from django.utils import timezone
from commerce import models


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
    pedido = models.Pedido.objects.get(id=pedido_id)
    assert float(pedido.valor_total) == pytest.approx(15.0)

    resp = api_client.patch(
        f"/api/itens-pedido/{data['id']}/", {"valor_unitario": "9.00"}, format="json"
    )
    assert resp.status_code == 200
    pedido.refresh_from_db()
    assert float(pedido.valor_total) == pytest.approx(18.0)

    resp = api_client.delete(f"/api/itens-pedido/{data['id']}/")
    assert resp.status_code == 204
    pedido.refresh_from_db()
    assert float(pedido.valor_total) == pytest.approx(0.0)


@pytest.mark.django_db
def test_itempedido_nao_pode_ignorar_minimo_financeiro_da_producao(
    api_client, produto, cliente
):
    from commerce import models

    pedido = models.Pedido.objects.create(
        cliente=cliente,
        forma_pagamento="Pix",
        prazo=timezone.localdate() + timedelta(days=2),
        valor_total=50,
        valor_pago=25,
        status="Em Producao",
    )
    models.ItemPedido.objects.create(
        pedido=pedido,
        produto=produto,
        peca="Item original",
        quantidade=1,
        valor_unitario="50.00",
    )

    response = api_client.post(
        "/api/itens-pedido/",
        {
            "pedido": pedido.id,
            "produto": produto.id,
            "peca": "Toalha",
            "quantidade": 1,
            "valor_unitario": "10.00",
        },
        format="json",
    )

    assert response.status_code == 400
    assert models.ItemPedido.objects.filter(pedido=pedido).count() == 1
    pedido.refresh_from_db()
    assert str(pedido.valor_total) == "50.00"
