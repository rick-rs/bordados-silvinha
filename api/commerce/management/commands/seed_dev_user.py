"""Create local development data."""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.utils import timezone

from commerce import models


class Command(BaseCommand):
    """Seed a simple local login user and demo data."""

    help = "Create a simple local test user and demo records."

    def handle(self, *args, **options):
        """Create or update local development records."""
        usuario, created = models.Usuario.objects.update_or_create(
            email="admin@teste.com",
            defaults={
                "nome": "Admin Teste",
                "senha_hash": make_password("admin"),
                "ativo": True,
            },
        )

        action = "created" if created else "updated"
        self.stdout.write(
            self.style.SUCCESS(f"Development user {action}: {usuario.email}")
        )

        clients = self.seed_clients()
        products = self.seed_products()
        materials = self.seed_materials()
        self.seed_stock_movements(materials)
        self.seed_orders(clients, products)
        self.stdout.write(self.style.SUCCESS("Development demo data ready."))

    def seed_clients(self):
        """Create embroidery-friendly clients."""
        client_payloads = [
            {
                "nome": "Maria Silva",
                "telefone": "(11) 99999-1001",
                "email": "maria.demo@teste.com",
                "rede_social": "@maria_enxoval",
                "cep": "01001-000",
                "endereco": "Praça da Sé",
                "numero": "100",
                "complemento": "Apto 12",
                "bairro": "Sé",
                "cidade": "São Paulo",
                "estado": "SP",
            },
            {
                "nome": "Clínica Sorriso",
                "telefone": "(21) 98888-2002",
                "email": "contato@sorrisodemo.com",
                "rede_social": "@clinicasorriso",
                "cep": "20040-020",
                "endereco": "Rua da Assembleia",
                "numero": "45",
                "complemento": "Sala 302",
                "bairro": "Centro",
                "cidade": "Rio de Janeiro",
                "estado": "RJ",
            },
            {
                "nome": "Fernanda Lima",
                "telefone": "(31) 97777-3003",
                "email": "fernanda.demo@teste.com",
                "rede_social": "@felima_baby",
                "cep": "30140-071",
                "endereco": "Rua da Bahia",
                "numero": "900",
                "complemento": "",
                "bairro": "Centro",
                "cidade": "Belo Horizonte",
                "estado": "MG",
            },
            {
                "nome": "João Souza",
                "telefone": "(41) 96666-4004",
                "email": "joao.demo@teste.com",
                "rede_social": "@souza.personalizados",
                "cep": "80010-000",
                "endereco": "Rua XV de Novembro",
                "numero": "250",
                "complemento": "",
                "bairro": "Centro",
                "cidade": "Curitiba",
                "estado": "PR",
            },
        ]

        clients = {}
        for payload in client_payloads:
            client, _ = models.Cliente.objects.update_or_create(
                email=payload["email"],
                defaults=payload,
            )
            clients[client.nome] = client

        return clients

    def seed_products(self):
        """Create catalog items for embroidery orders."""
        product_payloads = [
            {
                "nome": "Nome Bordado Simples",
                "descricao": "Bordado de nome em fonte cursiva ou bastão.",
                "preco_base": "35.00",
                "tempo_estimado": "0.50",
                "categoria": "Personalização",
                "subcategoria": "Nome",
                "tipo": "bordado",
                "quantidade_pontos": 2500,
                "ativo": True,
            },
            {
                "nome": "Logo Pequeno Bordado",
                "descricao": "Bordado de logotipo pequeno para uniforme.",
                "preco_base": "65.00",
                "tempo_estimado": "1.00",
                "categoria": "Corporativo",
                "subcategoria": "Logo",
                "tipo": "bordado",
                "quantidade_pontos": 6500,
                "ativo": True,
            },
            {
                "nome": "Kit Fralda Bordada",
                "descricao": "Fralda de boca com bordado personalizado.",
                "preco_base": "48.00",
                "tempo_estimado": "0.75",
                "categoria": "Bebê",
                "subcategoria": "Fralda",
                "tipo": "peca",
                "quantidade_pontos": None,
                "ativo": True,
            },
            {
                "nome": "Toalha de Banho Bordada",
                "descricao": "Toalha com nome bordado e acabamento simples.",
                "preco_base": "85.00",
                "tempo_estimado": "1.25",
                "categoria": "Enxoval",
                "subcategoria": "Toalha",
                "tipo": "peca",
                "quantidade_pontos": None,
                "ativo": True,
            },
        ]

        products = {}
        for payload in product_payloads:
            product, _ = models.Produto.objects.update_or_create(
                nome=payload["nome"],
                defaults=payload,
            )
            products[product.nome] = product

        return products

    def seed_materials(self):
        """Create stock materials for embroidery production."""
        material_payloads = [
            {
                "nome": "Linha Poliéster Rosa Bebê",
                "descricao": "Linha para nomes infantis e detalhes delicados.",
                "unidade_medida": "cone",
                "quantidade_atual": "2.00",
                "estoque_minimo": "5.00",
            },
            {
                "nome": "Linha Dourada Metálica",
                "descricao": "Linha metalizada para monogramas especiais.",
                "unidade_medida": "cone",
                "quantidade_atual": "1.00",
                "estoque_minimo": "3.00",
            },
            {
                "nome": "Entretela Fina",
                "descricao": "Entretela para estabilização de peças leves.",
                "unidade_medida": "metro",
                "quantidade_atual": "8.00",
                "estoque_minimo": "10.00",
            },
            {
                "nome": "Bastidor 13x18",
                "descricao": "Bastidor para áreas médias de bordado.",
                "unidade_medida": "unidade",
                "quantidade_atual": "4.00",
                "estoque_minimo": "2.00",
            },
        ]

        materials = {}
        for payload in material_payloads:
            material, _ = models.Material.objects.update_or_create(
                nome=payload["nome"],
                defaults=payload,
            )
            materials[material.nome] = material

        return materials

    def seed_stock_movements(self, materials):
        """Create stock movement history without changing current stock values."""
        movement_payloads = [
            {
                "material": materials["Linha Poliéster Rosa Bebê"],
                "tipo": "saida",
                "quantidade": Decimal("3.00"),
                "observacao": "DEMO:saida-linha-rosa - Consumo em toalhas bordadas.",
            },
            {
                "material": materials["Linha Dourada Metálica"],
                "tipo": "saida",
                "quantidade": Decimal("1.00"),
                "observacao": "DEMO:saida-linha-dourada - Monograma especial.",
            },
            {
                "material": materials["Entretela Fina"],
                "tipo": "entrada",
                "quantidade": Decimal("6.00"),
                "observacao": "DEMO:entrada-entretela - Reposição de rolo.",
            },
            {
                "material": materials["Bastidor 13x18"],
                "tipo": "entrada",
                "quantidade": Decimal("1.00"),
                "observacao": "DEMO:entrada-bastidor - Compra preventiva.",
            },
        ]

        models.MovimentacaoEstoque.objects.filter(
            observacao__startswith="DEMO:"
        ).delete()

        for payload in movement_payloads:
            models.MovimentacaoEstoque.objects.create(**payload)

    def seed_orders(self, clients, products):
        """Create demo orders with one or more items."""
        today = timezone.localdate()
        orders_payloads = [
            {
                "key": "DEMO:pedido-atrasado-maria",
                "cliente": clients["Maria Silva"],
                "data_pedido": today - timedelta(days=12),
                "prazo": today - timedelta(days=3),
                "canal": "Instagram",
                "forma_pagamento": "Pix",
                "status_pagamento": "Parcial",
                "status": "Em Producao",
                "valor_total": Decimal("170.00"),
                "observacoes": "DEMO:pedido-atrasado-maria - 2 toalhas com nome e floral.",
                "items": [
                    {
                        "produto": products["Toalha de Banho Bordada"],
                        "peca": "Toalha de banho",
                        "descricao_bordado": "Nome Maria + floral lateral",
                        "quantidade": 2,
                        "valor_unitario": Decimal("85.00"),
                    }
                ],
            },
            {
                "key": "DEMO:pedido-atrasado-clinica",
                "cliente": clients["Clínica Sorriso"],
                "data_pedido": today - timedelta(days=8),
                "prazo": today - timedelta(days=1),
                "canal": "WhatsApp",
                "forma_pagamento": "Transferencia",
                "status_pagamento": "Pendente",
                "status": "Aguardando Matriz",
                "valor_total": Decimal("260.00"),
                "observacoes": "DEMO:pedido-atrasado-clinica - Logos em jalecos.",
                "items": [
                    {
                        "produto": products["Logo Pequeno Bordado"],
                        "peca": "Jaleco",
                        "descricao_bordado": "Logo Clínica Sorriso",
                        "quantidade": 4,
                        "valor_unitario": Decimal("65.00"),
                    }
                ],
            },
            {
                "key": "DEMO:pedido-prazo-fernanda",
                "cliente": clients["Fernanda Lima"],
                "data_pedido": today - timedelta(days=2),
                "prazo": today + timedelta(days=4),
                "canal": "Instagram",
                "forma_pagamento": "Pix",
                "status_pagamento": "Pago",
                "status": "Recebido",
                "valor_total": Decimal("179.00"),
                "observacoes": "DEMO:pedido-prazo-fernanda - Kit bebê com três peças.",
                "items": [
                    {
                        "produto": products["Kit Fralda Bordada"],
                        "peca": "Fralda de boca",
                        "descricao_bordado": "Nome Sofia",
                        "quantidade": 2,
                        "valor_unitario": Decimal("48.00"),
                    },
                    {
                        "produto": products["Nome Bordado Simples"],
                        "peca": "Manta",
                        "descricao_bordado": "Nome Sofia em linha rosa",
                        "quantidade": 1,
                        "valor_unitario": Decimal("35.00"),
                    },
                    {
                        "produto": products["Kit Fralda Bordada"],
                        "peca": "Fralda de ombro",
                        "descricao_bordado": "Inicial S",
                        "quantidade": 1,
                        "valor_unitario": Decimal("48.00"),
                    },
                ],
            },
            {
                "key": "DEMO:pedido-hoje-maria",
                "cliente": clients["Maria Silva"],
                "data_pedido": today - timedelta(days=1),
                "prazo": today,
                "canal": "WhatsApp",
                "forma_pagamento": "Pix",
                "status_pagamento": "Pago",
                "status": "Pronto para Entrega",
                "valor_total": Decimal("65.00"),
                "observacoes": "DEMO:pedido-hoje-maria - Nome simples em necessaire.",
                "items": [
                    {
                        "produto": products["Nome Bordado Simples"],
                        "peca": "Necessaire",
                        "descricao_bordado": "Nome Ana em fonte cursiva",
                        "quantidade": 1,
                        "valor_unitario": Decimal("65.00"),
                    }
                ],
            },
            {
                "key": "DEMO:pedido-prazo-joao",
                "cliente": clients["João Souza"],
                "data_pedido": today,
                "prazo": today + timedelta(days=8),
                "canal": "WhatsApp",
                "forma_pagamento": "Cartao",
                "status_pagamento": "Pendente",
                "status": "Recebido",
                "valor_total": Decimal("100.00"),
                "observacoes": "DEMO:pedido-prazo-joao - Personalização de camisetas.",
                "items": [
                    {
                        "produto": products["Nome Bordado Simples"],
                        "peca": "Camiseta",
                        "descricao_bordado": "Iniciais JS",
                        "quantidade": 2,
                        "valor_unitario": Decimal("50.00"),
                    }
                ],
            },
        ]

        for payload in orders_payloads:
            order, _ = models.Pedido.objects.update_or_create(
                observacoes__startswith=payload["key"],
                defaults={
                    "cliente": payload["cliente"],
                    "data_pedido": payload["data_pedido"],
                    "prazo": payload["prazo"],
                    "canal": payload["canal"],
                    "forma_pagamento": payload["forma_pagamento"],
                    "status_pagamento": payload["status_pagamento"],
                    "status": payload["status"],
                    "valor_total": payload["valor_total"],
                    "observacoes": payload["observacoes"],
                },
            )
            order.itens.all().delete()

            for item_payload in payload["items"]:
                models.ItemPedido.objects.create(pedido=order, **item_payload)
