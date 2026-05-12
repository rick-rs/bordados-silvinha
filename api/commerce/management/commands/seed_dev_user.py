"""Create local development users."""

from django.core.management.base import BaseCommand

from commerce.models import Usuario


class Command(BaseCommand):
    """Seed a simple local login user."""

    help = "Create a simple local test user."

    def handle(self, *args, **options):
        """Create or update the local admin test user."""
        usuario, created = Usuario.objects.update_or_create(
            email="admin@teste.com",
            defaults={
                "nome": "Admin Teste",
                "senha_hash": "admin",
                "ativo": True,
            },
        )

        action = "created" if created else "updated"
        self.stdout.write(
            self.style.SUCCESS(f"Development user {action}: {usuario.email}")
        )
