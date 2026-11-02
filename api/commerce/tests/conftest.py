import pytest


@pytest.fixture
def api_client(db):
    from rest_framework.test import APIClient
    from commerce.authentication import issue_token
    from commerce.models import Usuario

    user = Usuario.objects.create(
        nome="API Admin",
        email="api-tester@example.local",
        senha_hash="test-hash",
        perfil="administrador",
        pode_gerenciar_matrizes=True,
    )

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_token(user)}")
    return client


@pytest.fixture
def anonymous_api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def cliente():
    from commerce import models

    return models.Cliente.objects.create(nome="Cliente Fixture")


@pytest.fixture
def produto():
    from commerce import models

    return models.Produto.objects.create(nome="Produto Fixture", preco_base=5)


@pytest.fixture
def usuario():
    from commerce import models

    return models.Usuario.objects.create(
        nome="Usuario Fixture", email="u@ex.com", senha_hash="h"
    )


@pytest.fixture
def material():
    from commerce import models

    return models.Material.objects.create(nome="Material Fixture")
