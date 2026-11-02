from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0003_accessibilityprofile"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="precisa_matriz",
            field=models.BooleanField(default=True),
        ),
    ]