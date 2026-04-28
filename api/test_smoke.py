"""Basic smoke tests for backend CI validation."""


def test_django_settings_loaded(settings):
    """Ensure Django settings load during test session."""
    assert settings is not None
