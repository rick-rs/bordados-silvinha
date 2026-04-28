"""API viewsets for commerce resources."""

from rest_framework import viewsets
from . import models, serializers


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet for `Usuario` (CRUD endpoints)."""

    queryset = models.Usuario.objects.all()
    serializer_class = serializers.UsuarioSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet for `Cliente`."""

    queryset = models.Cliente.objects.all()
    serializer_class = serializers.ClienteSerializer


class ProdutoViewSet(viewsets.ModelViewSet):
    """ViewSet for `Produto`."""

    queryset = models.Produto.objects.all()
    serializer_class = serializers.ProdutoSerializer


class PedidoViewSet(viewsets.ModelViewSet):
    """ViewSet for `Pedido`."""

    queryset = models.Pedido.objects.all()
    serializer_class = serializers.PedidoSerializer


class ItemPedidoViewSet(viewsets.ModelViewSet):
    """ViewSet for `ItemPedido`."""

    queryset = models.ItemPedido.objects.all()
    serializer_class = serializers.ItemPedidoSerializer


class HistoricoStatusViewSet(viewsets.ModelViewSet):
    """ViewSet for `HistoricoStatus`."""

    queryset = models.HistoricoStatus.objects.all()
    serializer_class = serializers.HistoricoStatusSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for `Material`."""

    queryset = models.Material.objects.all()
    serializer_class = serializers.MaterialSerializer


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    """ViewSet for `MovimentacaoEstoque`."""

    queryset = models.MovimentacaoEstoque.objects.all()
    serializer_class = serializers.MovimentacaoEstoqueSerializer
