import pytest


@pytest.mark.django_db
def test_pedido_create_and_crud(api_client, cliente):
    # Create pedido referencing existing cliente
    resp = api_client.post("/api/pedidos/", {"cliente": cliente.id}, format="json")
    assert resp.status_code == 201
    data = resp.json()
    pid = data["id"]

    resp = api_client.get(f"/api/pedidos/{pid}/")
    assert resp.status_code == 200

    resp = api_client.patch(
        f"/api/pedidos/{pid}/", {"valor_total": "12.34"}, format="json"
    )
    assert resp.status_code in (200, 202)

    resp = api_client.delete(f"/api/pedidos/{pid}/")
    assert resp.status_code in (204, 200, 202)
