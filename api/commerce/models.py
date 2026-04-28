"""Models for commerce domain: users, clients, products, orders and stock.

These mirror the ER diagram used by the frontend and are intentionally
minimal for now (fields and relationships only).
"""

from django.db import models


class Usuario(models.Model):
    """Represent a system user."""

    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    senha_hash = models.CharField(max_length=255)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return display name for admin and logs."""
        return self.nome


class Cliente(models.Model):
    """Represent a client with contact and address data."""

    nome = models.CharField(max_length=255)
    telefone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    rede_social = models.CharField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=50, blank=True, null=True)
    complemento = models.CharField(max_length=255, blank=True, null=True)
    bairro = models.CharField(max_length=255, blank=True, null=True)
    cidade = models.CharField(max_length=255, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return client name."""
        return self.nome


class Produto(models.Model):
    """Represent a product or service offered."""

    TIPO_CHOICES = (
        ("peca", "Peça"),
        ("bordado", "Bordado"),
    )

    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    imagem_url = models.TextField(blank=True, null=True)
    preco_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tempo_estimado = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    categoria = models.CharField(max_length=255, blank=True, null=True)
    subcategoria = models.CharField(max_length=255, blank=True, null=True)
    tipo = models.CharField(max_length=16, choices=TIPO_CHOICES, default="peca")
    quantidade_pontos = models.IntegerField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return product name."""
        return self.nome


class Pedido(models.Model):
    """Represent an order placed by a client."""

    CANAL_CHOICES = (
        ("Instagram", "Instagram"),
        ("WhatsApp", "WhatsApp"),
        ("Facebook", "Facebook"),
        ("Marketplace", "Marketplace"),
        ("Outro", "Outro"),
    )
    FORMA_PAGAMENTO_CHOICES = (
        ("Pix", "Pix"),
        ("Dinheiro", "Dinheiro"),
        ("Cartao", "Cartão"),
        ("Transferencia", "Transferência"),
    )
    STATUS_PAGAMENTO_CHOICES = (
        ("Pendente", "Pendente"),
        ("Parcial", "Parcial"),
        ("Pago", "Pago"),
    )
    STATUS_CHOICES = (
        ("Recebido", "Recebido"),
        ("Aguardando Matriz", "Aguardando Matriz"),
        ("Em Producao", "Em Produção"),
        ("Pronto para Entrega", "Pronto para Entrega"),
        ("Entregue", "Entregue"),
        ("Cancelado", "Cancelado"),
    )

    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name="pedidos"
    )
    data_pedido = models.DateField(blank=True, null=True)
    prazo = models.DateField(blank=True, null=True)
    data_entrega = models.DateField(blank=True, null=True)
    canal = models.CharField(
        max_length=32, choices=CANAL_CHOICES, blank=True, null=True
    )
    forma_pagamento = models.CharField(
        max_length=32, choices=FORMA_PAGAMENTO_CHOICES, blank=True, null=True
    )
    status_pagamento = models.CharField(
        max_length=32, choices=STATUS_PAGAMENTO_CHOICES, blank=True, null=True
    )
    urgente = models.BooleanField(default=False)
    observacoes = models.TextField(blank=True, null=True)
    motivo_cancelamento = models.TextField(blank=True, null=True)
    valor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="Recebido")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return a human-friendly representation for a pedido."""
        return f"Pedido #{self.id} - {self.cliente}"


class ItemPedido(models.Model):
    """Represent an item associated to a `Pedido`. Compute subtotal on save."""

    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="itens")
    produto = models.ForeignKey(
        Produto, on_delete=models.PROTECT, related_name="itens_pedido"
    )
    peca = models.CharField(max_length=255, blank=True, null=True)
    descricao_bordado = models.TextField(blank=True, null=True)
    quantidade = models.IntegerField(default=1)
    valor_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        """Compute subtotal before saving."""
        self.subtotal = (self.valor_unitario or 0) * (self.quantidade or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        """Return a string for an item in an order."""
        return f"Item {self.id} - Pedido {self.pedido_id}"


class HistoricoStatus(models.Model):
    """Record status changes for an order."""

    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="historico")
    usuario = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, related_name="historico"
    )
    status = models.CharField(max_length=32)
    registrado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Representation for history entry."""
        return f"Hist {self.id} - Pedido {self.pedido_id}"


class Material(models.Model):
    """Represent materials and stock items."""

    UNIDADE_CHOICES = (
        ("unidade", "unidade"),
        ("cone", "cone"),
        ("metro", "metro"),
        ("kg", "kg"),
        ("rolo", "rolo"),
        ("pecas", "peças"),
    )

    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    unidade_medida = models.CharField(
        max_length=20, choices=UNIDADE_CHOICES, default="unidade"
    )
    quantidade_atual = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estoque_minimo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return material name."""
        return self.nome


class MovimentacaoEstoque(models.Model):
    """Record stock entries/exits for a material."""

    TIPO = (("entrada", "entrada"), ("saida", "saída"))

    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="movimentacoes")
    tipo = models.CharField(max_length=16, choices=TIPO)
    quantidade = models.DecimalField(max_digits=12, decimal_places=2)
    observacao = models.TextField(blank=True, null=True)
    registrado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Return a short description for the movimentacao."""
        return f"Mov {self.id} - {self.material}"
