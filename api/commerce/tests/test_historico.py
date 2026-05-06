import pytest


@pytest.mark.django_db
def test_historico_status_create(api_client, cliente, usuario):
    # create pedido
    resp = api_client.post("/api/pedidos/", {"cliente": cliente.id}, format="json")
    assert resp.status_code == 201
    pedido_id = resp.json()["id"]

    payload = {"pedido": pedido_id, "usuario": usuario.id, "status": "Recebido"}
    resp = api_client.post("/api/historico-status/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "Recebido"
