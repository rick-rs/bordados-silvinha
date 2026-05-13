"""Serializers for commerce models (minimal for now)."""

from django.contrib.auth.hashers import identify_hasher, make_password
from django.utils import timezone
from rest_framework import serializers

from . import models


TERMINAL_ORDER_STATUSES = {"Entregue", "Cancelado"}


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

    class Meta:
        """Meta for PedidoSerializer."""

        model = models.Pedido
        fields = "__all__"

    def validate(self, attrs):
        """Validate order business rules that belong to the backend."""
        instance = self.instance
        payment_method = attrs.get(
            "forma_pagamento", getattr(instance, "forma_pagamento", None)
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
        next_status = attrs.get("status", current_status)

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
