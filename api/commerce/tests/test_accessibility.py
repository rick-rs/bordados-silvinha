"""Exercise real login credentials, ownership, validation and persistence."""
import pytest
from django.core import signing
from django.test import override_settings
from rest_framework.test import APIClient
from commerce.models import Usuario, AccessibilityProfile
from commerce.authentication import SALT, fingerprint

pytestmark = pytest.mark.django_db


def authenticated_client(email='accessibility@test.local'):
    user = Usuario.objects.create(nome='Teste', email=email, senha_hash='abc123')
    client = APIClient()
    response = client.post('/api/usuarios/login/', {'email': email, 'senha': 'abc123'}, format='json')
    assert response.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.json()['token']}")
    return client, user, response.json()


@override_settings(API_PUBLIC_ACCESS=True)
def test_anonymous_cannot_read_update_or_reset():
    client = APIClient()
    for method in ('get', 'patch', 'post'):
        assert getattr(client, method)('/api/accessibility-profile/').status_code == 401
    assert AccessibilityProfile.objects.count() == 0


def test_defaults_update_login_and_reset():
    client, user, login = authenticated_client()
    defaults = login['accessibility']
    assert defaults['text_size'] == 'standard'
    assert not any(value for key, value in defaults.items() if key != 'text_size')
    assert client.get('/api/accessibility-profile/').json() == defaults
    payload = {**defaults, 'text_size': 'extra_large', 'high_contrast': True, 'reduced_motion': True, 'highlight_links': True, 'readable_font': True, 'increased_spacing': True}
    assert client.patch('/api/accessibility-profile/', payload, format='json').json() == payload
    client.credentials()
    relogin = client.post('/api/usuarios/login/', {'email': user.email, 'senha': 'abc123'}, format='json').json()
    assert relogin['accessibility'] == payload
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {relogin['token']}")
    assert client.post('/api/accessibility-profile/').json() == defaults
    assert AccessibilityProfile.objects.get(user=user).text_size == 'standard'


def test_ownership_and_lazy_creation():
    first, user, _ = authenticated_client()
    second, other, _ = authenticated_client('other@test.local')
    assert first.patch('/api/accessibility-profile/', {'high_contrast': True}, format='json').status_code == 200
    assert second.get('/api/accessibility-profile/').json()['high_contrast'] is False
    assert first.patch('/api/accessibility-profile/', {'user': other.pk}, format='json').status_code == 400
    AccessibilityProfile.objects.filter(user=user).delete()
    assert first.get('/api/accessibility-profile/').json()['high_contrast'] is False
    assert AccessibilityProfile.objects.filter(user=user).count() == 1


@pytest.mark.parametrize('payload', [{'text_size': 'huge'}, {'text_size': None}, {'high_contrast': 'true'}, {'readable_font': 1}, {'reduced_motion': None}, {'unknown': True}, [], ['invalid'], 12])
def test_invalid_values(payload):
    client, _, _ = authenticated_client()
    assert client.patch('/api/accessibility-profile/', payload, format='json').status_code == 400
    assert client.get('/api/accessibility-profile/').json()['text_size'] == 'standard'


def test_invalid_expired_inactive_and_password_changed_tokens():
    client, user, response = authenticated_client()
    client.credentials(HTTP_AUTHORIZATION='Bearer forged')
    assert client.get('/api/accessibility-profile/').status_code == 401
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response['token']}")
    user.ativo = False
    user.save()
    assert client.get('/api/accessibility-profile/').status_code == 401
    user.ativo = True
    user.senha_hash = 'changed'
    user.save()
    assert client.get('/api/accessibility-profile/').status_code == 401
    from unittest.mock import patch
    with patch('django.core.signing.time.time', return_value=1):
        expired = signing.dumps({'user_id': user.pk, 'password': fingerprint(user)}, salt=SALT)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired}')
    assert client.get('/api/accessibility-profile/').status_code == 401
