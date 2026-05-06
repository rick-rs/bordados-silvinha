import pytest


@pytest.mark.django_db
def test_cliente_crud_api(api_client):
    payload = {"nome": "Cliente Teste", "telefone": "12345"}
    resp = api_client.post("/api/clientes/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == payload["nome"]

    cid = data["id"]
    resp = api_client.get(f"/api/clientes/{cid}/")
    assert resp.status_code == 200

    resp = api_client.patch(f"/api/clientes/{cid}/", {"telefone": "9999"}, format="json")
    assert resp.status_code in (200, 202)

    resp = api_client.delete(f"/api/clientes/{cid}/")
    assert resp.status_code in (204, 200, 202)
