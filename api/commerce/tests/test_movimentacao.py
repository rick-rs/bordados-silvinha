from decimal import Decimal

import pytest


@pytest.mark.django_db
def test_movimentacao_create(api_client, material):
    payload = {"material": material.id, "tipo": "entrada", "quantidade": "2.5"}
    resp = api_client.post("/api/movimentacoes-estoque/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert int(data["material"]) == material.id
    material.refresh_from_db()
    assert material.quantidade_atual == Decimal("2.50")


@pytest.mark.django_db
def test_movimentacao_saida_decreases_stock(api_client, material):
    material.quantidade_atual = Decimal("10.00")
    material.save(update_fields=["quantidade_atual"])

    payload = {"material": material.id, "tipo": "saida", "quantidade": "1.5"}
    resp = api_client.post("/api/movimentacoes-estoque/", payload, format="json")
    assert resp.status_code == 201

    material.refresh_from_db()
    assert material.quantidade_atual == Decimal("8.50")
