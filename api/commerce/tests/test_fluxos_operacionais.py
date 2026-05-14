from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from commerce import models


@pytest.mark.django_db
def test_criar_pedido_completo_com_itens_do_catalogo(api_client, cliente):
    peca = models.Produto.objects.create(
        nome="Camiseta",
        preco_base=Decimal("35.00"),
        tipo="peca",
    )
    bordado = models.Produto.objects.create(
        nome="Logo pequeno",
        preco_base=Decimal("15.00"),
        tipo="bordado",
    )

    resp = api_client.post(
        "/api/pedidos/criar-completo/",
        {
            "pedido": {
                "cliente": cliente.id,
                "forma_pagamento": "Pix",
                "status_pagamento": "Pendente",
                "canal": "WhatsApp",
                "prazo": (timezone.localdate() + timedelta(days=3)).isoformat(),
                "valor_total": "100.00",
            },
            "itens": [
                {
                    "produto": bordado.id,
                    "peca": peca.nome,
                    "local_bordado": "Peito",
                    "descricao_bordado": "Logo da empresa",
                    "quantidade": 2,
                    "valor_unitario": "50.00",
                }
            ],
        },
        format="json",
    )

    assert resp.status_code == 201
    data = resp.json()
    pedido = models.Pedido.objects.get(id=data["pedido"]["id"])
    item = pedido.itens.get()
    assert pedido.valor_total == Decimal("100.00")
    assert item.produto == bordado
    assert item.peca == "Camiseta"
    assert item.quantidade == 2
    assert item.subtotal == Decimal("100.00")


@pytest.mark.django_db
def test_criar_pedido_completo_reverte_pedido_quando_item_falha(api_client, cliente):
    resp = api_client.post(
        "/api/pedidos/criar-completo/",
        {
            "pedido": {
                "cliente": cliente.id,
                "forma_pagamento": "Pix",
                "status_pagamento": "Pendente",
                "prazo": (timezone.localdate() + timedelta(days=3)).isoformat(),
                "valor_total": "10.00",
            },
            "itens": [
                {
                    "produto": 99999,
                    "peca": "Camiseta",
                    "local_bordado": "Peito",
                    "quantidade": 1,
                    "valor_unitario": "10.00",
                }
            ],
        },
        format="json",
    )

    assert resp.status_code == 400
    assert models.Pedido.objects.count() == 0
    assert models.ItemPedido.objects.count() == 0


@pytest.mark.django_db
def test_catalogo_filtra_por_tipo_e_status_ativo(api_client):
    models.Produto.objects.create(nome="Camiseta", tipo="peca", ativo=True)
    models.Produto.objects.create(nome="Logo", tipo="bordado", ativo=True)
    models.Produto.objects.create(nome="Boné antigo", tipo="peca", ativo=False)

    resp = api_client.get("/api/produtos/", {"tipo": "peca", "ativo": "true"})

    assert resp.status_code == 200
    names = {produto["nome"] for produto in resp.json()["results"]}
    assert names == {"Camiseta"}


@pytest.mark.django_db
def test_estoque_filtra_alertas_de_reposicao(api_client):
    models.Material.objects.create(
        nome="Linha baixa",
        quantidade_atual=Decimal("1.00"),
        estoque_minimo=Decimal("2.00"),
    )
    models.Material.objects.create(
        nome="Linha ok",
        quantidade_atual=Decimal("5.00"),
        estoque_minimo=Decimal("2.00"),
    )

    resp = api_client.get("/api/materiais/", {"situacao": "reposicao"})

    assert resp.status_code == 200
    names = {material["nome"] for material in resp.json()["results"]}
    assert names == {"Linha baixa"}


@pytest.mark.django_db
def test_historico_movimentacoes_estoque_filtra_por_material(api_client):
    linha = models.Material.objects.create(nome="Linha")
    agulha = models.Material.objects.create(nome="Agulha")
    models.MovimentacaoEstoque.objects.create(
        material=agulha,
        tipo="entrada",
        quantidade=Decimal("3.00"),
    )
    saida_linha = models.MovimentacaoEstoque.objects.create(
        material=linha,
        tipo="saida",
        quantidade=Decimal("1.00"),
        observacao="Uso em pedido",
    )
    entrada_linha = models.MovimentacaoEstoque.objects.create(
        material=linha,
        tipo="entrada",
        quantidade=Decimal("5.00"),
    )

    resp = api_client.get("/api/movimentacoes-estoque/", {"material": linha.id})

    assert resp.status_code == 200
    ids = [movement["id"] for movement in resp.json()]
    assert ids == [entrada_linha.id, saida_linha.id]
