"""API viewsets for commerce resources."""

from decimal import Decimal

from django.contrib.auth.hashers import check_password
from django.db.models import F, Q
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import dashboard, models, serializers
from .pagination import StandardResultsSetPagination


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

    @action(detail=True, methods=["post"], url_path="trocar-senha")
    def trocar_senha(self, request, pk=None):
        """Change a user's password after checking the current password."""
        usuario = self.get_object()
        senha_atual = request.data.get("senha_atual", "")
        nova_senha = request.data.get("nova_senha", "")

        if not senha_confere(senha_atual, usuario.senha_hash):
            return Response(
                {"detail": "Senha atual invalida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not nova_senha:
            return Response(
                {"detail": "Informe a nova senha."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            usuario, data={"senha_hash": nova_senha}, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"detail": "Senha atualizada com sucesso."})


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet for `Cliente`."""

    queryset = models.Cliente.objects.all()
    pagination_class = StandardResultsSetPagination
    serializer_class = serializers.ClienteSerializer

    def get_queryset(self):
        """Filter clients by search text and location."""
        queryset = super().get_queryset().order_by("nome")
        query = self.request.query_params.get("q", "").strip()
        estado = self.request.query_params.get("estado", "").strip()

        if query:
            queryset = queryset.filter(
                Q(nome__icontains=query)
                | Q(telefone__icontains=query)
                | Q(email__icontains=query)
                | Q(rede_social__icontains=query)
                | Q(cidade__icontains=query)
            )

        if estado:
            queryset = queryset.filter(estado__iexact=estado)

        return queryset

    def destroy(self, request, *args, **kwargs):
        """Delete a client and dependent demo orders."""
        cliente = self.get_object()
        models.Pedido.objects.filter(cliente=cliente).delete()
        cliente.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProdutoViewSet(viewsets.ModelViewSet):
    """ViewSet for `Produto`."""

    queryset = models.Produto.objects.all()
    pagination_class = StandardResultsSetPagination
    serializer_class = serializers.ProdutoSerializer

    def get_queryset(self):
        """Filter products by search, type and active status."""
        queryset = super().get_queryset().order_by("nome")
        query = self.request.query_params.get("q", "").strip()
        tipo = self.request.query_params.get("tipo", "").strip()
        ativo = self.request.query_params.get("ativo", "").strip().lower()

        if query:
            queryset = queryset.filter(
                Q(nome__icontains=query)
                | Q(descricao__icontains=query)
                | Q(categoria__icontains=query)
                | Q(subcategoria__icontains=query)
            )

        if tipo:
            queryset = queryset.filter(tipo=tipo)

        if ativo in ("true", "false"):
            queryset = queryset.filter(ativo=ativo == "true")

        return queryset

    def destroy(self, request, *args, **kwargs):
        """Delete a product and dependent order items."""
        produto = self.get_object()
        models.ItemPedido.objects.filter(produto=produto).delete()
        produto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PedidoViewSet(viewsets.ModelViewSet):
    """ViewSet for `Pedido`."""

    queryset = models.Pedido.objects.all()
    pagination_class = StandardResultsSetPagination
    serializer_class = serializers.PedidoSerializer

    def get_queryset(self):
        """Filter orders by status, payment, channel, period and search text."""
        queryset = super().get_queryset().select_related("cliente").order_by(
            "-criado_em", "-id"
        )
        query = self.request.query_params.get("q", "").strip()
        status_param = self.request.query_params.get("status", "").strip()
        payment = self.request.query_params.get("status_pagamento", "").strip()
        canal = self.request.query_params.get("canal", "").strip()
        date_from = self.request.query_params.get("prazo_inicio", "").strip()
        date_to = self.request.query_params.get("prazo_fim", "").strip()

        if query:
            query_filter = (
                Q(cliente__nome__icontains=query)
                | Q(observacoes__icontains=query)
                | Q(canal__icontains=query)
            )

            if query.isdigit():
                query_filter |= Q(id=int(query))

            queryset = queryset.filter(query_filter)

        if status_param:
            queryset = queryset.filter(status=status_param)

        if payment:
            queryset = queryset.filter(status_pagamento=payment)

        if canal:
            queryset = queryset.filter(canal=canal)

        if date_from:
            queryset = queryset.filter(prazo__gte=date_from)

        if date_to:
            queryset = queryset.filter(prazo__lte=date_to)

        return queryset

    def update(self, request, *args, **kwargs):
        """Set delivery data when needed and keep status history."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        previous_status = instance.status
        data = request.data.copy()

        if data.get("status") == "Entregue" and not data.get("data_entrega"):
            data["data_entrega"] = timezone.localdate().isoformat()

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        updated_status = serializer.instance.status

        if updated_status != previous_status:
            models.HistoricoStatus.objects.create(
                pedido=serializer.instance,
                usuario=None,
                status=updated_status,
                status_anterior=previous_status,
                status_novo=updated_status,
                motivo=serializer.instance.motivo_cancelamento
                if updated_status == "Cancelado"
                else serializer.instance.observacoes_entrega,
            )

        return Response(serializer.data)

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
    pagination_class = StandardResultsSetPagination
    serializer_class = serializers.MaterialSerializer

    def get_queryset(self):
        """Filter materials by search text, unit and stock situation."""
        queryset = super().get_queryset().order_by("nome")
        query = self.request.query_params.get("q", "").strip()
        unidade = self.request.query_params.get("unidade", "").strip()
        situacao = self.request.query_params.get("situacao", "").strip()

        if query:
            queryset = queryset.filter(
                Q(nome__icontains=query) | Q(descricao__icontains=query)
            )

        if unidade:
            queryset = queryset.filter(unidade_medida=unidade)

        if situacao == "reposicao":
            queryset = queryset.filter(quantidade_atual__lte=F("estoque_minimo"))
        elif situacao == "ok":
            queryset = queryset.filter(quantidade_atual__gt=F("estoque_minimo"))

        return queryset


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    """ViewSet for `MovimentacaoEstoque`."""

    queryset = models.MovimentacaoEstoque.objects.all()
    serializer_class = serializers.MovimentacaoEstoqueSerializer

    def get_queryset(self):
        """Filter stock movements by material and show recent records first."""
        queryset = super().get_queryset().select_related("material").order_by(
            "-registrado_em", "-id"
        )
        material = self.request.query_params.get("material", "").strip()

        if material:
            queryset = queryset.filter(material_id=material)

        return queryset

    def perform_create(self, serializer):
        """Record the movement and update the material current quantity."""
        movement = serializer.save()
        multiplier = Decimal("1") if movement.tipo == "entrada" else Decimal("-1")

        models.Material.objects.filter(id=movement.material_id).update(
            quantidade_atual=F("quantidade_atual") + (movement.quantidade * multiplier)
        )
