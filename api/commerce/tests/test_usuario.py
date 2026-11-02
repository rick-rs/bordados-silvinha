from io import StringIO
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APIClient

from commerce import models
from commerce.authentication import issue_token


def usuario_client(usuario):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_token(usuario)}")
    return client


@pytest.mark.django_db
@override_settings(
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    }
)
def test_admin_index_uses_jazzmin(anonymous_api_client):
    django_user = get_user_model().objects.create_superuser(
        username="admin-user", email="admin@test.local", password="secret"
    )
    anonymous_api_client.force_login(django_user)
    response = anonymous_api_client.get("/admin/")

    assert response.status_code == 200
    assert b"jazzmin" in response.content.lower()


@pytest.mark.django_db
@override_settings(
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"
        },
    },
)
def test_admin_index_supports_production_static_storage(anonymous_api_client):
    django_user = get_user_model().objects.create_superuser(
        username="admin-user", email="admin@test.local", password="secret"
    )
    anonymous_api_client.force_login(django_user)

    response = anonymous_api_client.get("/admin/")

    assert response.status_code == 200
    assert b"jazzmin" in response.content.lower()


@pytest.mark.django_db
def test_usuario_crud_api(api_client):
    payload = {"nome": "Usu Teste", "email": "u@test.local", "senha_hash": "x"}
    resp = api_client.post("/api/usuarios/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == payload["email"]
    assert "senha_hash" not in data
    assert data["perfil"] == "geral"
    assert data["pode_gerenciar_matrizes"] is False
    usuario = models.Usuario.objects.get(id=data["id"])
    assert usuario.senha_hash != payload["senha_hash"]
    assert check_password(payload["senha_hash"], usuario.senha_hash)

    uid = data["id"]
    resp = api_client.get(f"/api/usuarios/{uid}/")
    assert resp.status_code == 200

    resp = api_client.patch(
        f"/api/usuarios/{uid}/",
        {
            "nome": "Usu Novo",
            "perfil": "geral",
            "pode_gerenciar_matrizes": True,
        },
        format="json",
    )
    assert resp.status_code in (200, 202)
    assert resp.json()["perfil"] == "geral"
    assert resp.json()["pode_gerenciar_matrizes"] is True

    resp = api_client.patch(
        f"/api/usuarios/{uid}/", {"ativo": False}, format="json"
    )
    assert resp.status_code == 200
    assert resp.json()["ativo"] is False


@pytest.mark.django_db
def test_administrador_pode_configurar_perfil_e_permissao_matriz(api_client):
    response = api_client.post(
        "/api/usuarios/",
        {
            "nome": "Aprovador",
            "email": "aprovador@test.local",
            "senha_hash": "senha123",
            "perfil": "geral",
            "pode_gerenciar_matrizes": True,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["perfil"] == "geral"
    assert response.json()["pode_gerenciar_matrizes"] is True


@pytest.mark.django_db
@override_settings(API_PUBLIC_ACCESS=True)
def test_usuario_geral_so_acessa_a_propria_conta(api_client):
    own = models.Usuario.objects.create(
        nome="Usuário Geral",
        email="geral@test.local",
        senha_hash="hash",
    )
    other = models.Usuario.objects.create(
        nome="Outra Conta",
        email="outra@test.local",
        senha_hash="hash",
    )
    client = usuario_client(own)

    assert client.get("/api/usuarios/").status_code == 403
    assert client.get(f"/api/usuarios/{other.id}/").status_code == 404
    assert client.patch(
        f"/api/usuarios/{other.id}/", {"nome": "Invadida"}, format="json"
    ).status_code == 404
    assert client.delete(f"/api/usuarios/{other.id}/").status_code == 403
    assert client.get(f"/api/usuarios/{own.id}/").status_code == 200
    assert client.patch(
        f"/api/usuarios/{own.id}/", {"nome": "Nome Atualizado"}, format="json"
    ).status_code == 200
    assert client.post(
        "/api/usuarios/",
        {"nome": "Conta", "email": "conta@test.local", "senha_hash": "pw"},
        format="json",
    ).status_code == 403


@pytest.mark.django_db
def test_usuario_geral_nao_pode_elevar_o_proprio_perfil(api_client):
    user = models.Usuario.objects.create(
        nome="Usuário Geral",
        email="sem-promocao@test.local",
        senha_hash="hash",
    )
    client = usuario_client(user)

    response = client.patch(
        f"/api/usuarios/{user.id}/",
        {"perfil": "administrador", "pode_gerenciar_matrizes": True},
        format="json",
    )

    assert response.status_code == 400
    user.refresh_from_db()
    assert user.perfil == "geral"
    assert user.pode_gerenciar_matrizes is False


@pytest.mark.django_db
@override_settings(API_PUBLIC_ACCESS=True)
def test_usuarios_nao_autenticados_nao_administram_contas(anonymous_api_client):
    assert anonymous_api_client.get("/api/usuarios/").status_code == 401
    assert anonymous_api_client.post(
        "/api/usuarios/", {"nome": "Anon", "email": "anon@test.local", "senha_hash": "pw"}, format="json"
    ).status_code == 401


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
def test_usuario_login_nao_exige_csrf_de_sessao_django():
    django_user = get_user_model().objects.create_user(
        username="session-user", password="secret"
    )
    client = APIClient(enforce_csrf_checks=True)
    client.force_login(django_user)

    response = client.post(
        "/api/usuarios/login/",
        {"email": "missing@test.local", "senha": "invalid"},
        format="json",
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha invalidos."


@pytest.mark.django_db
def test_bootstrap_cria_administrador_sem_permissao_de_matriz_implicita():
    with patch(
        "commerce.management.commands.bootstrap_admin.getpass",
        side_effect=["secure-pass", "secure-pass"],
    ):
        call_command(
            "bootstrap_admin",
            nome="Admin Inicial",
            email="admin-inicial@test.local",
            stdout=StringIO(),
        )

    user = models.Usuario.objects.get(email="admin-inicial@test.local")
    assert user.perfil == "administrador"
    assert user.pode_gerenciar_matrizes is False
    assert check_password("secure-pass", user.senha_hash)


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
