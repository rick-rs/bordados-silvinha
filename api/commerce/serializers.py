"""Serializers for commerce models (minimal for now)."""

from rest_framework import serializers
from . import models


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer for `Usuario`."""

    class Meta:
        """Meta for UsuarioSerializer."""

        model = models.Usuario
        fields = "__all__"


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
