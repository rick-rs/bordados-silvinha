import pytest
from django.contrib.auth.hashers import check_password

from commerce import models


@pytest.mark.django_db
def test_usuario_crud_api(api_client):
    payload = {"nome": "Usu Teste", "email": "u@test.local", "senha_hash": "x"}
    resp = api_client.post("/api/usuarios/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == payload["email"]
    assert "senha_hash" not in data
    usuario = models.Usuario.objects.get(id=data["id"])
    assert usuario.senha_hash != payload["senha_hash"]
    assert check_password(payload["senha_hash"], usuario.senha_hash)

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
def test_usuario_login_api(anonymous_api_client):
    payload = {"nome": "Usu Teste", "email": "login@test.local", "senha_hash": "abc123"}
    models.Usuario.objects.create(**payload)

    resp = anonymous_api_client.post(
        "/api/usuarios/login/",
        {"email": payload["email"], "senha": payload["senha_hash"]},
        format="json",
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["usuario"]["email"] == payload["email"]


@pytest.mark.django_db
def test_usuario_login_rejeita_credenciais_invalidas(anonymous_api_client):
    payload = {"nome": "Usu Teste", "email": "erro@test.local", "senha_hash": "abc123"}
    models.Usuario.objects.create(**payload)

    resp = anonymous_api_client.post(
        "/api/usuarios/login/",
        {"email": payload["email"], "senha": "senha-errada"},
        format="json",
    )

    assert resp.status_code == 401


@pytest.mark.django_db
def test_usuario_troca_senha_com_hash(api_client):
    payload = {
        "nome": "Usu Teste",
        "email": "troca@test.local",
        "senha_hash": "abc123",
    }
    created = api_client.post("/api/usuarios/", payload, format="json").json()

    resp = api_client.post(
        f"/api/usuarios/{created['id']}/trocar-senha/",
        {"senha_atual": "abc123", "nova_senha": "nova123"},
        format="json",
    )

    assert resp.status_code == 200
    usuario = models.Usuario.objects.get(id=created["id"])
    assert usuario.senha_hash != "nova123"
    assert check_password("nova123", usuario.senha_hash)
