from getpass import getpass

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError

from commerce.models import Usuario


class Command(BaseCommand):
    help = "Create the first administrator account with an interactive password prompt."

    def add_arguments(self, parser):
        parser.add_argument("--nome", required=True)
        parser.add_argument("--email", required=True)

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        if Usuario.objects.filter(email=email).exists():
            raise CommandError(f"Já existe uma conta com o e-mail {email}.")

        password = getpass("Senha do administrador: ")
        confirmation = getpass("Confirme a senha: ")
        if not password or password != confirmation:
            raise CommandError("As senhas estão vazias ou não coincidem.")

        user = Usuario.objects.create(
            nome=options["nome"].strip(),
            email=email,
            senha_hash=make_password(password),
            perfil="administrador",
        )
        self.stdout.write(self.style.SUCCESS(f"Administrador criado: {user.email}"))