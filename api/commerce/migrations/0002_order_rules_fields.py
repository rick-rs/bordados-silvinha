from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="historicostatus",
            name="motivo",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="historicostatus",
            name="status_anterior",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="historicostatus",
            name="status_novo",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="itempedido",
            name="local_bordado",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="pedido",
            name="observacoes_entrega",
            field=models.TextField(blank=True, null=True),
        ),
    ]
