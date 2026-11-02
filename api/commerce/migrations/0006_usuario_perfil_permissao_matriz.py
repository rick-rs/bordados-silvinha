from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0005_pedido_valor_pago"),
    ]

    operations = [
        migrations.AddField(
            model_name="usuario",
            name="perfil",
            field=models.CharField(
                choices=[("administrador", "Administrador"), ("geral", "Usuário geral")],
                default="geral",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="usuario",
            name="pode_gerenciar_matrizes",
            field=models.BooleanField(default=False),
        ),
    ]