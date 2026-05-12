import pytest


@pytest.mark.django_db
def test_produto_crud_api():
    from rest_framework.test import APIClient

    client = APIClient()

    # Create
    payload = {"nome": "Camiseta Teste", "preco_base": "49.90"}
    resp = client.post("/api/produtos/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == payload["nome"]

    produto_id = data["id"]

    # Retrieve list
    resp = client.get("/api/produtos/")
    assert resp.status_code == 200
    items = resp.json()["results"]
    assert any(p["id"] == produto_id for p in items)

    # Retrieve detail
    resp = client.get(f"/api/produtos/{produto_id}/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == produto_id

    # Update
    resp = client.patch(
        f"/api/produtos/{produto_id}/", {"nome": "Camiseta X"}, format="json"
    )
    assert resp.status_code in (200, 202)
    data = resp.json()
    assert data["nome"] == "Camiseta X"

    # Delete
    resp = client.delete(f"/api/produtos/{produto_id}/")
    assert resp.status_code in (204, 200, 202)

    # Ensure deleted
    resp = client.get(f"/api/produtos/{produto_id}/")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_itempedido_subtotal_model():
    from commerce import models

    cliente = models.Cliente.objects.create(nome="Cliente Teste")
    produto = models.Produto.objects.create(nome="Produto A", preco_base=10)
    pedido = models.Pedido.objects.create(cliente=cliente)

    item = models.ItemPedido(
        pedido=pedido, produto=produto, quantidade=3, valor_unitario=12.5
    )
    item.save()

    assert float(item.subtotal) == pytest.approx(37.5)
