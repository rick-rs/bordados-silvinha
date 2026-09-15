"""Signed, expiring credentials for the existing commerce Usuario model."""
from django.core import signing
from django.utils.crypto import salted_hmac, constant_time_compare
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from .models import Usuario

SALT = "commerce.usuario.access-token"

def fingerprint(user):
    return salted_hmac(SALT, user.senha_hash).hexdigest()

def issue_token(user):
    return signing.dumps({"user_id": user.pk, "password": fingerprint(user)}, salt=SALT)

class UsuarioAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header or header[0].lower() != b"bearer":
            return None
        try:
            if len(header) != 2:
                raise ValueError()
            payload = signing.loads(header[1].decode(), salt=SALT, max_age=60 * 60 * 24 * 7)
            user = Usuario.objects.get(pk=payload["user_id"], ativo=True)
            if not constant_time_compare(payload["password"], fingerprint(user)):
                raise ValueError()
        except (signing.BadSignature, Usuario.DoesNotExist, KeyError, ValueError, UnicodeDecodeError):
            raise AuthenticationFailed("Sessão inválida ou expirada. Entre novamente.")
        return user, header[1]

    def authenticate_header(self, request):
        return "Bearer"
