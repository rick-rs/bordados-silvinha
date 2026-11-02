from django.db import migrations, models
from django.db.models import F


def migrate_paid_amounts(apps, schema_editor):
    Pedido = apps.get_model("commerce", "Pedido")
    Pedido.objects.filter(status_pagamento="Pago").update(valor_pago=F("valor_total"))
    Pedido.objects.filter(status_pagamento="Parcial").update(status_pagamento="Pendente")


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0004_pedido_precisa_matriz"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="valor_pago",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.RunPython(migrate_paid_amounts, migrations.RunPython.noop),
    ]