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

    resp = api_client.patch(
        f"/api/usuarios/{uid}/", {"nome": "Usu Novo"}, format="json"
    )
    assert resp.status_code in (200, 202)

    resp = api_client.delete(f"/api/usuarios/{uid}/")
    assert resp.status_code in (204, 200, 202)


@pytest.mark.django_db
def test_usuario_login_api(api_client):
    payload = {"nome": "Usu Teste", "email": "login@test.local", "senha_hash": "abc123"}
    api_client.post("/api/usuarios/", payload, format="json")

    resp = api_client.post(
        "/api/usuarios/login/",
        {"email": payload["email"], "senha": payload["senha_hash"]},
        format="json",
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["usuario"]["email"] == payload["email"]


@pytest.mark.django_db
def test_usuario_login_rejeita_credenciais_invalidas(api_client):
    payload = {"nome": "Usu Teste", "email": "erro@test.local", "senha_hash": "abc123"}
    api_client.post("/api/usuarios/", payload, format="json")

    resp = api_client.post(
        "/api/usuarios/login/",
        {"email": payload["email"], "senha": "senha-errada"},
        format="json",
    )

    assert resp.status_code == 401
