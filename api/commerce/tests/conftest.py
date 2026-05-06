import os

import django

# Ensure settings are configured when pytest collects tests
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

import pytest
from rest_framework.test import APIClient

from commerce import models


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def cliente():
    return models.Cliente.objects.create(nome="Cliente Fixture")


@pytest.fixture
def produto():
    return models.Produto.objects.create(nome="Produto Fixture", preco_base=5)


@pytest.fixture
def usuario():
    return models.Usuario.objects.create(
        nome="Usuario Fixture", email="u@ex.com", senha_hash="h"
    )


@pytest.fixture
def material():
    return models.Material.objects.create(nome="Material Fixture")
