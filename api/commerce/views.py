"""API viewsets for commerce resources."""

from django.contrib.auth.hashers import check_password
from django.utils.crypto import constant_time_compare
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import dashboard, models, serializers


def senha_confere(senha: str, senha_armazenada: str) -> bool:
    """Support Django password hashes and legacy plain values."""
    return check_password(senha, senha_armazenada) or constant_time_compare(
        senha, senha_armazenada
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """Authenticate a `Usuario` by email and password."""
    return login_response(request)


def login_response(request):
    """Build login response for API views."""
    serializer = serializers.LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    senha = serializer.validated_data["senha"]

    usuario = models.Usuario.objects.filter(email=email, ativo=True).first()
    if not usuario or not senha_confere(senha, usuario.senha_hash):
        return Response(
            {"detail": "E-mail ou senha invalidos."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(
        {
            "usuario": serializers.UsuarioSerializer(usuario).data,
        }
    )


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet for `Usuario` (CRUD endpoints)."""

    queryset = models.Usuario.objects.all()
    serializer_class = serializers.UsuarioSerializer

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="login",
    )
    def login(self, request):
        """Authenticate a `Usuario` by email and password."""
        return login_response(request)


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

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        """Return dashboard summary data."""
        return Response(dashboard.get_dashboard_summary())


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
