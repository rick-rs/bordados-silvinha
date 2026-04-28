"""Router and URL registrations for commerce API."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"usuarios", views.UsuarioViewSet)
router.register(r"clientes", views.ClienteViewSet)
router.register(r"produtos", views.ProdutoViewSet)
router.register(r"pedidos", views.PedidoViewSet)
router.register(r"itens-pedido", views.ItemPedidoViewSet)
router.register(r"historico-status", views.HistoricoStatusViewSet)
router.register(r"materiais", views.MaterialViewSet)
router.register(r"movimentacoes-estoque", views.MovimentacaoEstoqueViewSet)

urlpatterns = [path("", include(router.urls))]
