"""Admin registrations for commerce models."""

from django.contrib import admin

from . import models


@admin.register(models.Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    """Admin for `Usuario`. Shows basic fields and provides search."""

    list_display = ("id", "nome", "email", "ativo", "criado_em")
    search_fields = ("nome", "email")


@admin.register(models.Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """Admin settings for `Cliente`."""

    list_display = ("id", "nome", "email", "telefone")
    search_fields = ("nome", "email", "telefone")


@admin.register(models.Produto)
class ProdutoAdmin(admin.ModelAdmin):
    """Admin for `Produto`."""

    list_display = ("id", "nome", "categoria", "tipo", "preco_base", "ativo")
    search_fields = ("nome", "categoria")


@admin.register(models.Pedido)
class PedidoAdmin(admin.ModelAdmin):
    """Admin for `Pedido`."""

    list_display = ("id", "cliente", "data_pedido", "status", "valor_total")
    list_filter = ("status",)


@admin.register(models.ItemPedido)
class ItemPedidoAdmin(admin.ModelAdmin):
    """Admin for `ItemPedido`."""

    list_display = (
        "id",
        "pedido",
        "produto",
        "quantidade",
        "valor_unitario",
        "subtotal",
    )


@admin.register(models.HistoricoStatus)
class HistoricoStatusAdmin(admin.ModelAdmin):
    """Admin for `HistoricoStatus`."""

    list_display = ("id", "pedido", "usuario", "status", "registrado_em")


@admin.register(models.Material)
class MaterialAdmin(admin.ModelAdmin):
    """Admin for `Material`."""

    list_display = ("id", "nome", "quantidade_atual", "estoque_minimo")


@admin.register(models.MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    """Admin for `MovimentacaoEstoque`."""

    list_display = ("id", "material", "tipo", "quantidade", "registrado_em")
