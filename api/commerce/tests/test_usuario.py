import pytest


@pytest.mark.django_db
def test_usuario_crud_api(api_client):
    payload = {"nome": "Usu Teste", "email": "u@test.local", "senha_hash": "x"}
    resp = api_client.post("/api/usuarios/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == payload["email"]

    uid = data["id"]
    resp = api_client.get(f"/api/usuarios/{uid}/")
    assert resp.status_code == 200

    resp = api_client.patch(f"/api/usuarios/{uid}/", {"nome": "Usu Novo"}, format="json")
    assert resp.status_code in (200, 202)

    resp = api_client.delete(f"/api/usuarios/{uid}/")
    assert resp.status_code in (204, 200, 202)
