import pytest


@pytest.mark.django_db
def test_produto_crud_api(api_client):
    payload = {"nome": "Camiseta Teste", "preco_base": "49.90"}
    resp = api_client.post("/api/produtos/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == payload["nome"]

    produto_id = data["id"]

    # Retrieve
    resp = api_client.get(f"/api/produtos/{produto_id}/")
    assert resp.status_code == 200

    # Update
    resp = api_client.patch(f"/api/produtos/{produto_id}/", {"nome": "Camiseta X"}, format="json")
    assert resp.status_code in (200, 202)
    assert resp.json()["nome"] == "Camiseta X"

    # Delete
    resp = api_client.delete(f"/api/produtos/{produto_id}/")
    assert resp.status_code in (204, 200, 202)
