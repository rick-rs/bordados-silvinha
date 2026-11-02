"""Serializers for commerce models (minimal for now)."""

from django.contrib.auth.hashers import identify_hasher, make_password
from django.utils import timezone
from rest_framework import serializers

from . import models

TERMINAL_ORDER_STATUSES = {"Entregue", "Cancelado"}
PRODUCTION_ORDER_STATUSES = {
    "Aguardando Matriz",
    "Em Producao",
    "Pronto para Entrega",
    "Entregue",
}
ORDER_TRANSITIONS = {
    "Aguardando Matriz": {"Em Producao"},
    "Em Producao": {"Pronto para Entrega"},
    "Pronto para Entrega": {"Entregue"},
}


def is_password_hash(value: str) -> bool:
    """Return whether the value already looks like a Django password hash."""
    try:
        identify_hasher(value)
    except ValueError:
        return False

    return True


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer for `Usuario`."""

    class Meta:
        """Meta for UsuarioSerializer."""

        model = models.Usuario
        fields = "__all__"
        extra_kwargs = {"senha_hash": {"write_only": True}}

    def create(self, validated_data):
        """Hash passwords received through the API."""
        password = validated_data.get("senha_hash")

        if password and not is_password_hash(password):
            validated_data["senha_hash"] = make_password(password)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Hash password changes received through the API."""
        password = validated_data.get("senha_hash")

        if password and not is_password_hash(password):
            validated_data["senha_hash"] = make_password(password)

        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    """Validate login payload."""

    email = serializers.EmailField()
    senha = serializers.CharField(trim_whitespace=False, write_only=True)


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer for `Cliente`."""

    class Meta:
        """Meta for ClienteSerializer."""

        model = models.Cliente
        fields = "__all__"


class ProdutoSerializer(serializers.ModelSerializer):
    """Serializer for `Produto`."""

    class Meta:
        """Meta for ProdutoSerializer."""

        model = models.Produto
        fields = "__all__"


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer for `Pedido`."""

    precisa_matriz = serializers.BooleanField(required=False, default=True)
    status_pagamento = serializers.SerializerMethodField()
    saldo_restante = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    liberado_financeiro = serializers.BooleanField(read_only=True)

    class Meta:
        """Meta for PedidoSerializer."""

        model = models.Pedido
        fields = "__all__"

    def create(self, validated_data):
        """Default new orders to the current local date."""
        validated_data.setdefault("data_pedido", timezone.localdate())
        pedido = super().create(validated_data)
        pedido.atualizar_status_pagamento(save=True)
        return pedido

    def update(self, instance, validated_data):
        pedido = super().update(instance, validated_data)
        pedido.atualizar_status_pagamento(save=True)
        return pedido

    def get_status_pagamento(self, instance):
        if instance.valor_total > 0 and instance.valor_pago >= instance.valor_total:
            return "Pago"
        if instance.valor_pago > 0:
            return "Parcial"
        return "Pendente"

    def validate(self, attrs):
        """Validate order business rules that belong to the backend."""
        instance = self.instance
        payment_method = attrs.get(
            "forma_pagamento", getattr(instance, "forma_pagamento", None)
        )
        total = attrs.get("valor_total", getattr(instance, "valor_total", 0))
        paid = attrs.get("valor_pago", getattr(instance, "valor_pago", 0))

        if total < 0:
            raise serializers.ValidationError(
                {"valor_total": "O valor total nao pode ser negativo."}
            )

        if paid < 0 or paid > total:
            raise serializers.ValidationError(
                {"valor_pago": "O valor pago deve estar entre zero e o total do pedido."}
            )

        if not payment_method:
            raise serializers.ValidationError(
                {"forma_pagamento": "Informe a forma de pagamento."}
            )

        if not instance or "prazo" in attrs or "data_pedido" in attrs:
            due_date = attrs.get("prazo", getattr(instance, "prazo", None))
            order_date = (
                attrs.get("data_pedido", getattr(instance, "data_pedido", None))
                or timezone.localdate()
            )

            if due_date and due_date <= order_date:
                raise serializers.ValidationError(
                    {
                        "prazo": (
                            "O prazo de entrega deve ser uma data futura em "
                            "relacao a data do pedido."
                        )
                    }
                )

        current_status = getattr(instance, "status", None)
        next_status = attrs.get("status", current_status or "Recebido")

        financial_release = total < 50 or paid * 2 >= total

        if (
            next_status in PRODUCTION_ORDER_STATUSES
            and not financial_release
            and not self.context.get("skip_financial_release", False)
        ):
            raise serializers.ValidationError(
                {
                    "status": (
                        "Para liberar a producao de pedidos a partir de R$ 50,00, "
                        "registre o pagamento de pelo menos 50%."
                    )
                }
            )

        if not instance and next_status != "Recebido":
            raise serializers.ValidationError(
                {"status": "Um pedido novo deve iniciar como Recebido."}
            )

        if instance and next_status != current_status:
            if next_status == "Cancelado":
                pass
            elif current_status == "Recebido":
                expected_status = (
                    "Aguardando Matriz" if attrs.get("precisa_matriz", instance.precisa_matriz)
                    else "Em Producao"
                )
                if next_status != expected_status:
                    raise serializers.ValidationError(
                        {"status": f"A proxima etapa deste pedido e {expected_status}."}
                    )
            elif next_status not in ORDER_TRANSITIONS.get(current_status, set()):
                raise serializers.ValidationError(
                    {"status": "Transicao de status invalida para esta etapa do pedido."}
                )

        if (
            instance
            and current_status in TERMINAL_ORDER_STATUSES
            and next_status != current_status
        ):
            raise serializers.ValidationError(
                {"status": "Pedido entregue ou cancelado nao pode mudar de status."}
            )

        cancel_reason = attrs.get(
            "motivo_cancelamento", getattr(instance, "motivo_cancelamento", None)
        )

        if next_status == "Cancelado" and not cancel_reason:
            raise serializers.ValidationError(
                {"motivo_cancelamento": "Informe o motivo do cancelamento."}
            )

        return attrs


class ItemPedidoSerializer(serializers.ModelSerializer):
    """Serializer for `ItemPedido`."""

    class Meta:
        """Meta for ItemPedidoSerializer."""

        model = models.ItemPedido
        fields = "__all__"


class HistoricoStatusSerializer(serializers.ModelSerializer):
    """Serializer for `HistoricoStatus`."""

    class Meta:
        """Meta for HistoricoStatusSerializer."""

        model = models.HistoricoStatus
        fields = "__all__"


class MaterialSerializer(serializers.ModelSerializer):
    """Serializer for `Material`."""

    class Meta:
        """Meta for MaterialSerializer."""

        model = models.Material
        fields = "__all__"


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    """Serializer for `MovimentacaoEstoque`."""

    class Meta:
        """Meta for MovimentacaoEstoqueSerializer."""

        model = models.MovimentacaoEstoque
        fields = "__all__"


class AccessibilityProfileSerializer(serializers.ModelSerializer):
    """Strictly validate preferences; never accept an owner from the client."""
    class Meta:
        model = models.AccessibilityProfile
        fields = ("text_size", "high_contrast", "reduced_motion", "highlight_links", "readable_font", "increased_spacing")

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError({"non_field_errors": ["Informe um objeto JSON de preferências."]})
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({field: "Campo desconhecido." for field in unknown})
        for field in self.fields:
            if field != "text_size" and field in data and type(data[field]) is not bool:
                raise serializers.ValidationError({field: "Informe true ou false."})
        return super().to_internal_value(data)
