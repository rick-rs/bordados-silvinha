"""App config for commerce app."""

from django.apps import AppConfig


class CommerceConfig(AppConfig):
    """Configuration for the commerce app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "commerce"
    verbose_name = "Commerce"
